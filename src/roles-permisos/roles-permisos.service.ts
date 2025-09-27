// src/roles-permisos/roles-permisos.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRolesPermisoDto } from './dto/create-roles-permiso.dto';
import { UpdateRolesPermisoDto } from './dto/update-roles-permiso.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesPermisosService {
  constructor(private prisma: PrismaService) { }

  // Crear un nuevo rol y asignarle permisos
  async createRole(dto: CreateRolesPermisoDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const role = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: dto.name.toUpperCase() } },
      update: {},
      create: { tenantId: tenant.id, name: dto.name.toUpperCase() },
    });

    const ids: string[] = [];

    // Prioridad 1: permissionCodes
    if (dto.permissionCodes?.length) {
      const perms = await this.prisma.permisos.findMany({
        where: { codigo: { in: dto.permissionCodes } },
        select: { id: true, codigo: true },
      });
      const encontrados = new Set(perms.map(p => p.codigo));
      const faltantes = dto.permissionCodes.filter(c => !encontrados.has(c));
      if (faltantes.length) {
        throw new BadRequestException(`Permisos inexistentes: ${faltantes.join(', ')}`);
      }
      ids.push(...perms.map(p => p.id));
    }

    // Prioridad 2: permissionIds
    if (dto.permissionIds?.length) {
      ids.push(...dto.permissionIds);
    }

    // Asignar si hay IDs simples
    if (ids.length) {
      await this.prisma.$transaction(
        ids.map(permisoId =>
          this.prisma.rolePermisos.upsert({
            where: { roleId_permisoId: { roleId: role.id, permisoId } },
            update: { allowed: true },
            create: { roleId: role.id, permisoId, allowed: true },
          })
        )
      );
    }

    // Prioridad 3: permiso explícito con allowed=true/false
    if (dto.permissions?.length) {
      await this.prisma.$transaction(
        dto.permissions.map(({ id, allowed = true }) =>
          this.prisma.rolePermisos.upsert({
            where: { roleId_permisoId: { roleId: role.id, permisoId: id } },
            update: { allowed },
            create: { roleId: role.id, permisoId: id, allowed },
          })
        )
      );
    }

    return this.prisma.roles.findUnique({
      where: { id: role.id },
      include: { RolePermisos: { include: { permiso: true } } },
    });
  }

  // Obtener todos los roles
  // Listar roles (opcionalmente por tenantSlug)
  async getRoles(tenantSlug?: string) {
    return this.prisma.roles.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug } } : undefined,
      include: { RolePermisos: { include: { permiso: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Obtener 1 rol por id
  async getRoleById(roleId: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
      include: { RolePermisos: { include: { permiso: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  // Obtener todos los permisos
  async getPermissions() {
    return this.prisma.permisos.findMany({
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, descripcion: true },
    });
  }

  // Asignar permisos a un rol
  // Agregar permisos (IDs) a un rol (idempotente)
  async assignPermissionsToRole(roleId: string, permissions: string[]) {
    if (!permissions?.length) throw new BadRequestException('Sin permisos a asignar');

    // Asegura que el rol exista
    const exists = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!exists) throw new NotFoundException('Rol no encontrado');

    await this.prisma.$transaction(
      permissions.map((permisoId) =>
        this.prisma.rolePermisos.upsert({
          where: { roleId_permisoId: { roleId, permisoId } },
          update: { allowed: true },
          create: { roleId, permisoId, allowed: true },
        }),
      ),
    );

    return this.getRoleById(roleId);
  }

  async updatePermissionsForRole(roleId: string, permissions: string[]) {
    const role = await this.prisma.roles.update({
      where: { id: roleId },
      data: {
        RolePermisos: {
          updateMany: permissions.map((permisoId) => ({
            where: { permisoId },
            data: { allowed: true }, // Aquí puedes actualizar otros campos si es necesario
          })),
        },
      },
    });

    return role;
  }

  async removePermissionsFromRole(roleId: string, permissions: string[]) {
    const role = await this.prisma.roles.update({
      where: { id: roleId },
      data: {
        RolePermisos: {
          deleteMany: {
            permisoId: { in: permissions },
          },
        },
      },
    });

    return role;
  }

  async seedDefaultRoles(tenantSlug: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const rolesData = [
      {
        name: 'ADMIN',
        permissionCodes: [
          'vacantes.create',
          'vacantes.edit',
          'vacantes.read',
          'postulaciones.read',
          'postulaciones.edit',
          'candidatos.read',
          'candidatos.create',
          'candidatos.edit',
        ],
      },
      {
        name: 'RECLUTADOR',
        permissionCodes: [
          'vacantes.read',
          'postulaciones.read',
          'candidatos.read',
        ],
      },
    ];

    for (const { name, permissionCodes } of rolesData) {
      // Crea el rol si no existe
      const role = await this.prisma.roles.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name },
      });

      // Filtrar permisos existentes
      const existingPerms = await this.prisma.permisos.findMany({
        where: { codigo: { in: permissionCodes } },
        select: { id: true, codigo: true },
      });

      const encontrados = new Set(existingPerms.map(p => p.codigo));
      const faltantes = permissionCodes.filter(code => !encontrados.has(code));
      if (faltantes.length) {
        console.warn(`⚠️  Permisos no encontrados (se omiten): ${faltantes.join(', ')}`);
      }

      // Asignar los permisos encontrados
      await this.prisma.$transaction(
        existingPerms.map(({ id }) =>
          this.prisma.rolePermisos.upsert({
            where: { roleId_permisoId: { roleId: role.id, permisoId: id } },
            update: { allowed: true },
            create: { roleId: role.id, permisoId: id, allowed: true },
          })
        )
      );
    }
  }

}
