import { Controller, Post, Body, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';

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


}
