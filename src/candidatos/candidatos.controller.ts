import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CandidatosService } from './candidatos.service';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { AdminOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('candidatos')
@Controller('candidatos')
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear candidato desde backend (uso interno)' })
  @ApiBody({
    type: CreateCandidatoDto,
    examples: {
      soloCandidato: {
        summary: 'Solo registra candidato',
        value: {
          tenantSlug: 'tecnoedil',
          nombre: 'María López',
          email: 'maria@example.com',
          telefono: '0981-111-222',
          cvUrl: 'https://cdn/cv.pdf',
          perfil: { skills: ['Node', 'React'] }
        }
      },
      candidatoConUsuario: {
        summary: 'Registra candidato y crea usuario (rol CANDIDATO)',
        value: {
          tenantSlug: 'tecnoedil',
          nombre: 'María López',
          email: 'maria@example.com',
          createUser: true,
          password: 'Secr3ta123',
          perfil: { linkedin: 'https://linkedin.com/in/maria' }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Candidato creado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya existe en este tenant' })
  create(@Body() dto: CreateCandidatoDto) {
    return this.candidatosService.create(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar candidatos por tenant (incluye puntaje y postulaciones recientes)' })
  @ApiQuery({ name: 'tenant', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Query('tenant') tenant: string,
    @Query('search') search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    const resolvedTenant = tenant?.trim().toLowerCase() || req.user?.tenant;
    if (!resolvedTenant) {
      throw new BadRequestException('tenant es requerido');
    }
    if (!req.user?.isSuperAdmin && resolvedTenant !== req.user?.tenant) {
      throw new BadRequestException('No tienes acceso a este tenant');
    }
    return this.candidatosService.listByTenant(resolvedTenant, { search, page, limit });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Detalle completo de un candidato con historial de postulaciones' })
  @ApiParam({ name: 'id', description: 'ID del candidato' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.candidatosService.findDetailById(id, req.user);
  }

}
