// src/tenants/tenants.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { FilterTenantsDto } from './dto/filter-tenants.dto';
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

  // tenants.service.ts
  async findAll(params: FilterTenantsDto) {
    const {
      page = 1,
      limit = 10,
      name,
      slug,
      status,
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (slug) {
      where.slug = { contains: slug, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenants.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tenants.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
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

  async updateById(id: string, dto: UpdateTenantDto) {
    if (dto.slug) {
      const existing = await this.prisma.tenants.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('slug ya existe');
      }
    }

    try {
      return await this.prisma.tenants.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          slug: dto.slug?.trim(),
          status: dto.status,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Tenant no encontrado');
      if (e.code === 'P2002') throw new ConflictException('slug ya existe');
      throw e;
    }
  }


}
