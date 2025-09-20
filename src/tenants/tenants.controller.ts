// src/tenants/tenants.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { formatAsuncion } from '../common/utils/time.util';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, } from '@nestjs/swagger';
//import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) { }

  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tenant (solo SuperAdmin)' })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Slug ya existe' })
  async create(@Body() dto: CreateTenantDto) {
    const t = await this.tenants.create(dto);
    return { ...t, createdAtLocal: formatAsuncion(t.createdAt) }; // añade campo auxiliar
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tenants' })
  @ApiResponse({ status: 200, description: 'Lista de tenants' })
  findAll() {
    return this.tenants.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener tenant por slug' })
  @ApiParam({ name: 'slug', description: 'Slug del tenant' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  findOne(@Param('slug') slug: string) {
    return this.tenants.findBySlug(slug);
  }

  // en TenantsController
  // src/tenants/tenants.controller.ts
  @Get(':slug/roles')
  @ApiOperation({ summary: 'Listar roles de un tenant' })
  @ApiParam({ name: 'slug', description: 'Slug del tenant' })
  @ApiResponse({ status: 200, description: 'Lista de roles para el tenant' })
  findRoles(@Param('slug') slug: string) {
    return this.tenants.findRolesBySlug(slug);
  }

  // @Patch(':slug')
  // update(@Param('slug') slug: string, @Body() dto: UpdateTenantDto) {
  //   return this.tenants.update(slug, dto);
  // }

  // @Delete(':slug')
  // remove(@Param('slug') slug: string) {
  //   return this.tenants.remove(slug);
  // }
}
