import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { RolesPermisosService } from './roles-permisos.service';
import { CreateRolesPermisoDto } from './dto/create-roles-permiso.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';
import { UpdateRolesPermisoDto } from './dto/update-roles-permiso.dto';
import { AdminOrSuperAdminGuard } from '../common/guards/superadmin.guard';

class AssignPermsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}

class SyncPermsDto {
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[] = [];
}

@ApiTags('roles y permisos')
@Controller('roles-permisos')
@UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
export class RolesPermisosController {
  constructor(private readonly rolesPermisosService: RolesPermisosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo rol (por tenantSlug) y opcionalmente asignar permisos (IDs)' })
  @ApiResponse({ status: 201, description: 'Rol creado o recuperado (upsert) y permisos asignados.' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado.' })
  @ApiBody({ type: CreateRolesPermisoDto })
  async createRole(@Body() dto: CreateRolesPermisoDto) {
    return this.rolesPermisosService.createRole(dto);
  }

  @Get('permisos/list')
  @ApiOperation({ summary: 'Listar permisos globales' })
  async listPerms() {
    return this.rolesPermisosService.getPermissions();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener roles (opcional: filtrar por tenant slug)' })
  @ApiQuery({ name: 'tenant', required: false })
  @ApiResponse({ status: 200, description: 'Lista de roles (con permisos) obtenida exitosamente.' })
  async getRoles(@Query('tenant') tenant?: string) {
    return this.rolesPermisosService.getRoles(tenant);
  }

  @Get(':roleId')
  @ApiOperation({ summary: 'Obtener un rol por su ID (incluye permisos)' })
  @ApiResponse({ status: 200, description: 'Rol obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  async getRole(@Param('roleId') roleId: string) {
    return this.rolesPermisosService.getRoleById(roleId);
  }

  @Post(':roleId/assign-permissions')
  @ApiOperation({ summary: 'Asignar permisos (IDs) a un rol (idempotente)' })
  @ApiResponse({ status: 200, description: 'Permisos asignados correctamente y rol devuelto.' })
  @ApiBody({ type: AssignPermsDto, description: 'Lista de IDs de permisos a asignar' })
  async assignPermissionsToRole(@Param('roleId') roleId: string, @Body() body: AssignPermsDto) {
    return this.rolesPermisosService.assignPermissionsToRole(roleId, body.permissions);
  }

  @Put(':roleId/permissions')
  @ApiOperation({ summary: 'Reemplazar completamente los permisos asignados a un rol (sincronización)' })
  @ApiResponse({ status: 200, description: 'Permisos sincronizados correctamente.' })
  @ApiBody({ type: SyncPermsDto })
  async replacePermissions(@Param('roleId') roleId: string, @Body() body: SyncPermsDto) {
    return this.rolesPermisosService.replaceRolePermissions(roleId, body.permissionIds ?? []);
  }

  @Patch(':roleId')
  @ApiOperation({ summary: 'Actualizar datos del rol (nombre, tenant, permisos base)' })
  async updateRole(@Param('roleId') roleId: string, @Body() dto: UpdateRolesPermisoDto) {
    return this.rolesPermisosService.updateRole(roleId, dto);
  }

  @Delete(':roleId')
  @ApiOperation({ summary: 'Eliminar un rol y sus asignaciones' })
  async removeRole(@Param('roleId') roleId: string) {
    return this.rolesPermisosService.removeRole(roleId);
  }
}
