import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRolesPermisoDto } from './dto/create-roles-permiso.dto';
import { UpdateRolesPermisoDto } from './dto/update-roles-permiso.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesPermisosService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: CreateRolesPermisoDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const role = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: dto.name.toUpperCase() } },
      update: { tenantId: tenant.id },
      create: { tenantId: tenant.id, name: dto.name.toUpperCase() },
    });

    await this.applyPermissionsForDto(role.id, dto);

    return this.getRoleById(role.id);
  }

  async updateRole(roleId: string, dto: UpdateRolesPermisoDto) {
    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    if (role.name === 'SUPERADMIN' && dto.name && dto.name.toUpperCase() !== 'SUPERADMIN') {
      throw new ForbiddenException('No puedes renombrar el rol SUPERADMIN');
    }

    let tenantId = role.tenantId;
    if (dto.tenantSlug && dto.tenantSlug.trim()) {
      const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug.trim() } });
      if (!tenant) throw new NotFoundException('Tenant no encontrado');
      tenantId = tenant.id;
    }

    await this.prisma.roles.update({
      where: { id: roleId },
      data: {
        tenantId,
        name: dto.name ? dto.name.trim().toUpperCase() : undefined,
      },
    });

    await this.applyPermissionsForDto(roleId, dto);

    return this.getRoleById(roleId);
  }

  async removeRole(roleId: string) {
    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.name === 'SUPERADMIN') throw new ForbiddenException('No puedes eliminar el rol SUPERADMIN');

    await this.prisma.usuarioRoles.deleteMany({ where: { roleId } });
    await this.prisma.rolePermisos.deleteMany({ where: { roleId } });
    await this.prisma.roles.delete({ where: { id: roleId } });

    return { message: 'Rol eliminado' };
  }

  async getRoles(tenantSlug?: string) {
    return this.prisma.roles.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug } } : undefined,
      include: {
        tenant: { select: { slug: true, name: true } },
        RolePermisos: { include: { permiso: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRoleById(roleId: string) {
    const role = await this.prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        tenant: { select: { slug: true, name: true } },
        RolePermisos: { include: { permiso: true } },
      },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async getPermissions() {
    return this.prisma.permisos.findMany({
      orderBy: { codigo: 'asc' },
      select: { id: true, codigo: true, descripcion: true },
    });
  }

  async assignPermissionsToRole(roleId: string, permissions: string[]) {
    if (!permissions?.length) throw new BadRequestException('Sin permisos a asignar');

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

  async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    await this.prisma.rolePermisos.deleteMany({ where: { roleId } });

    if (permissionIds?.length) {
      await this.prisma.rolePermisos.createMany({
        data: permissionIds.map((permisoId) => ({
          roleId,
          permisoId,
          allowed: true,
        })),
        skipDuplicates: true,
      });
    }

    return this.getRoleById(roleId);
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
        permissionCodes: ['vacantes.read', 'postulaciones.read', 'candidatos.read'],
      },
    ];

    for (const { name, permissionCodes } of rolesData) {
      const role = await this.prisma.roles.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: {},
        create: { tenantId: tenant.id, name },
      });

      await this.applyPermissionsForDto(role.id, { permissionCodes });
    }
  }

  private async applyPermissionsForDto(roleId: string, dto: Partial<CreateRolesPermisoDto>) {
    if (!dto) return;
    const ids: string[] = [];

    if (dto.permissionCodes?.length) {
      const perms = await this.prisma.permisos.findMany({
        where: { codigo: { in: dto.permissionCodes } },
        select: { id: true, codigo: true },
      });
      const encontrados = new Set(perms.map((p) => p.codigo));
      const faltantes = dto.permissionCodes.filter((code) => !encontrados.has(code));
      if (faltantes.length) {
        throw new BadRequestException(`Permisos inexistentes: ${faltantes.join(', ')}`);
      }
      ids.push(...perms.map((p) => p.id));
    }

    if (dto.permissionIds?.length) {
      ids.push(...dto.permissionIds);
    }

    if (ids.length) {
      await this.prisma.$transaction(
        ids.map((permisoId) =>
          this.prisma.rolePermisos.upsert({
            where: { roleId_permisoId: { roleId, permisoId } },
            update: { allowed: true },
            create: { roleId, permisoId, allowed: true },
          }),
        ),
      );
    }

    if (dto.permissions?.length) {
      await this.prisma.$transaction(
        dto.permissions.map(({ id, allowed = true }) =>
          this.prisma.rolePermisos.upsert({
            where: { roleId_permisoId: { roleId, permisoId: id } },
            update: { allowed },
            create: { roleId, permisoId: id, allowed },
          }),
        ),
      );
    }
  }
}
