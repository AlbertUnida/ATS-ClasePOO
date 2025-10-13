// src/tenants/tenants.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Query, Post, UseGuards, Headers, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { formatAsuncion } from '../common/utils/time.util';
import { AuthGuard } from '@nestjs/passport';
import { FilterTenantsDto } from './dto/filter-tenants.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiCookieAuth } from '@nestjs/swagger';
//import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) { }


  @Post()
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear un nuevo tenant (solo SuperAdmin)' })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 201, description: 'Tenant creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Slug ya existe' })
  async create(@Body() dto: CreateTenantDto) {
    const t = await this.tenants.create(dto);
    return { ...t, createdAtLocal: formatAsuncion(t.createdAt) }; // añade campo auxiliar
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar todos los tenants' })
  @ApiResponse({ status: 200, description: 'Lista de tenants paginada y filtrada' })
  @UsePipes(new ValidationPipe({ transform: true }))  // Añadido el ValidationPipe
  findAll(@Query() query: FilterTenantsDto) {
    return this.tenants.findAll(query);
  }

  // tenants.controller.ts
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @Get(':id')
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener un tenant por ID (solo SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.tenants.findById(id);
  }

  @Get('slug/:slug')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener tenant por slug' })
  @ApiParam({ name: 'slug', description: 'Slug del tenant' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tenants.findBySlug(slug);
  }

  // en TenantsController
  // src/tenants/tenants.controller.ts
  @Get(':slug/roles')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Listar roles de un tenant' })
  @ApiParam({ name: 'slug', description: 'Slug del tenant' })
  @ApiResponse({ status: 200, description: 'Lista de roles para el tenant' })
  findRoles(@Param('slug') slug: string) {
    return this.tenants.findRolesBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard) // 🔐 Solo accesible con JWT + SuperAdmin
  @ApiCookieAuth('access-token') // 🔐 Swagger indica que se requiere cookie con token
  @ApiOperation({ summary: 'Actualizar un tenant por ID (solo SuperAdmin)' })
  @ApiParam({ name: 'id', description: 'ID del tenant' })
  @ApiBody({ type: UpdateTenantDto })
  @ApiResponse({ status: 200, description: 'Tenant actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Slug en uso por otro tenant' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const updated = await this.tenants.updateById(id, dto);
    return {
      ...updated,
      updatedAtLocal: formatAsuncion(updated.updatedAt ?? new Date()),
    };
  }

  // @Delete(':slug')
  // remove(@Param('slug') slug: string) {
  //   return this.tenants.remove(slug);
  // }
}
