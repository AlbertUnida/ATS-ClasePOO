// src/tenants/tenants.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { toSlug } from '../common/utils/slug.util';
import { RolesPermisosService } from '../roles-permisos/roles-permisos.service';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private rolesPermisosService: RolesPermisosService,
  ) { }

  // tenants.service.ts
  async create(dto: CreateTenantDto) {
    const slug = dto.slug?.trim() || toSlug(dto.name);
    try {
      const tenant = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET time_zone = '-03:00'`);
        return tx.tenants.create({
          data: {
            name: dto.name.trim(),
            slug,
            status: (dto.status ?? 'activo') as any,
          },
        });
      });

      // 👇 Crear roles base para este tenant
      await this.rolesPermisosService.seedDefaultRoles(slug);

      return tenant;

    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('slug ya existe');
      throw e;
    }
  }

  findAll() {
    return this.prisma.tenants.findMany({
      orderBy: { createdAt: 'desc' },
      // take/skip si quieres paginar rápido
    });
  }

  // El slug es una versión simplificada, legible y "URL-amigable" de un nombre o título. 
  // Se usa comúnmente para identificar recursos de forma única en URLs.
  async findBySlug(slug: string) {
    const t = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!t) throw new NotFoundException('Tenant no encontrado');
    return t;
  }

  async findRolesBySlug(slug: string) {
    return this.prisma.roles.findMany({
      where: { tenant: { slug } },   // requiere que Roles tenga relación "tenant"
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  // async update(slug: string, dto: UpdateTenantDto) {
  //   // si cambian slug, verificar conflicto
  //   if (dto.slug) {
  //     const exists = await this.prisma.tenants.findUnique({ where: { slug: dto.slug } });
  //     if (exists && exists.slug !== slug) throw new ConflictException('slug ya existe');
  //   }
  //   try {
  //     return await this.prisma.tenants.update({
  //       where: { slug },
  //       data: {
  //         name: dto.name?.trim(),
  //         slug: dto.slug ? dto.slug.trim() : undefined,
  //         status: dto.status as any,
  //       },
  //     });
  //   } catch (e: any) {
  //     if (e.code === 'P2025') throw new NotFoundException('Tenant no encontrado');
  //     if (e.code === 'P2002') throw new ConflictException('slug ya existe');
  //     throw e;
  //   }
  // }

  // async remove(slug: string) {
  //   try {
  //     // Borrado real para dev (rápido). Cuando quieras, cambia a soft delete (deletedAt).
  //     return await this.prisma.tenants.delete({ where: { slug } });
  //   } catch (e: any) {
  //     if (e.code === 'P2025') throw new NotFoundException('Tenant no encontrado');
  //     throw e;
  //   }
  // }
}
