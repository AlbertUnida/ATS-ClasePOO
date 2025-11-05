/// <reference types="multer" />
import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdateVacanteDto } from './dto/update-vacante.dto';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Express } from 'express';

const VACANTE_UPLOADS_DIR = join(process.cwd(), 'uploads', 'vacantes');
if (!existsSync(VACANTE_UPLOADS_DIR)) {
  mkdirSync(VACANTE_UPLOADS_DIR, { recursive: true });
}

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/jpg', 'image/pjpeg']);

@ApiTags('vacantes')
@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantes: VacantesService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear vacante (requiere tenantSlug y cargoId)' })
  @ApiBody({ type: CreateVacanteDto })
  create(@Body() dto: CreateVacanteDto, @Req() req: any) {
    return this.vacantes.create(dto, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar vacantes propias (opcional: ?estado=cerrada)' })
  @ApiQuery({ name: 'tenant', required: true })
  @ApiQuery({ name: 'estado', required: false })
  list(@Query('tenant') tenant: string, @Query('estado') estado: string, @Req() req: any) {
    return this.vacantes.list(tenant.trim().toLowerCase(), req.user, estado);
  }

  @Get('publicas')
  @ApiOperation({ summary: 'Listar vacantes públicas y abiertas (sin login)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  listPublicas(@Query('tenant') tenant: string) {
    if (!tenant) throw new BadRequestException('tenant es requerido');
    return this.vacantes.listPublicasTenantOnly(tenant.trim().toLowerCase());
  }

  @Get('publicasTodas')
  @ApiOperation({ summary: 'Listar todas las vacantes públicas de todos los tenants' })
  listPublicasTodas() {
    return this.vacantes.listTodasPublicas();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Actualizar vacante por ID (admin o superadmin)' })
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiBody({ type: UpdateVacanteDto })
  @ApiResponse({ status: 200, description: 'Vacante actualizada' })
  @ApiResponse({ status: 404, description: 'Vacante no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async update(@Param('id') id: string, @Body() dto: UpdateVacanteDto, @Req() req: any) {
    return this.vacantes.update(id, dto, req.user);
  }

  @Post(':id/imagen')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: VACANTE_UPLOADS_DIR,
        filename: (_req, file, callback) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, unique);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
          return callback(new BadRequestException('Solo se permiten imagenes jpg o png'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Actualizar imagen asociada a una vacante' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID de la vacante' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de imagen (jpg o png)',
        },
      },
    },
  })
  async uploadImagen(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Archivo de imagen requerido');
    const publicPath = `/uploads/vacantes/${file.filename}`;
    return this.vacantes.updateImagen(id, publicPath, req.user);
  }

}
