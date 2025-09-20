import { Controller, Post, Body, Get, Param, Put, Delete, Query } from '@nestjs/common';
import { RolesPermisosService } from './roles-permisos.service';
import { CreateRolesPermisoDto } from './dto/create-roles-permiso.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { SuperAdminGuard } from '../common/guards/superadmin.guard';
import { AuthGuard } from '@nestjs/passport';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

class AssignPermsDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true })
  permissions: string[];
}

@ApiTags('roles y permisos')
@Controller('roles-permisos')
export class RolesPermisosController {
  constructor(private readonly rolesPermisosService: RolesPermisosService) { }

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

  // @Put(':roleId/update-permissions')
  // @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  // @ApiResponse({ status: 200, description: 'Permisos actualizados correctamente.' })
  // @ApiBody({ type: [String], description: 'Lista de permisos a actualizar' })
  // async updatePermissionsForRole(@Param('roleId') roleId: string, @Body() permissions: string[]) {
  //   return this.rolesPermisosService.updatePermissionsForRole(roleId, permissions);
  // }

  // @Delete(':roleId/remove-permissions')
  // @ApiOperation({ summary: 'Eliminar permisos de un rol' })
  // @ApiResponse({ status: 200, description: 'Permisos eliminados correctamente.' })
  // @ApiBody({ type: [String], description: 'Lista de permisos a eliminar' })
  // async removePermissionsFromRole(@Param('roleId') roleId: string, @Body() permissions: string[]) {
  //   return this.rolesPermisosService.removePermissionsFromRole(roleId, permissions);
  // }
}
