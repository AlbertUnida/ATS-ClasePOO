import { Controller, Get, Post, Body, Req, Query, Patch, Param, UseGuards, Delete, ForbiddenException } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';

@ApiTags('cargos')
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargos: CargosService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear cargo (requiere tenantSlug)' })
  @ApiBody({ type: CreateCargoDto })
  @ApiResponse({ status: 201, description: 'Cargo creado' })
  create(@Body() dto: CreateCargoDto, @Req() req: any) {
    return this.cargos.create(dto, req.user);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar cargos (opcional: filtrar por ?tenant=slug)' })
  @ApiQuery({ name: 'tenant', required: false, description: 'Slug del tenant para filtrar' })
  list(@Query('tenant') tenant: string, @Req() req: any) {
    const t = tenant?.trim().toLowerCase();

    if (!t && !req.user.roles.includes('SUPERADMIN')) {
      // ⚠️ Solo el SUPERADMIN puede listar todos
      throw new ForbiddenException('Solo el superadmin puede ver todos los cargos');
    }

    return t
      ? this.cargos.listByTenant(t, req.user)
      : this.cargos.findAll(); // Solo superadmin puede llegar acá
  }


  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cargo por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Cargo encontrado' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cargos.findOne(id);
  }
}
