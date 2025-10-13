import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CargosService {
  constructor(private prisma: PrismaService) { }

  private present(c: any) {
    const { competenciasJson, ...rest } = c;
    return { ...rest, competencias: competenciasJson ? JSON.parse(competenciasJson) : undefined };
  }

  async create(dto: CreateCargoDto, user: any) {
    // Para todos los usuarios, usás el tenant del token (más seguro)
    const tenantSlug = user.roles.includes('SUPERADMIN') ? user.tenant : user.tenant;

    if (!tenantSlug) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const cargo = await this.prisma.cargos.create({
      data: {
        tenantId: tenant.id,
        nombre: dto.nombre,
        competenciasJson: dto.competencias
          ? JSON.stringify(dto.competencias)
          : undefined,
      },
    });

    return this.present(cargo);
  }

  async listByTenant(tenantSlug: string, user: any) {
    if (!user.roles.includes('SUPERADMIN') && user.tenant !== tenantSlug.toLowerCase()) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }

    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const rows = await this.prisma.cargos.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(this.present);
  }

  // Opcional: listado general con filtro por tenant
  async findAll(tenantSlug?: string) {
    const rows = await this.prisma.cargos.findMany({
      where: tenantSlug ? { tenant: { slug: tenantSlug.toLowerCase() } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.present);
  }

  // Opcional: obtener por id
  async findOne(id: string) {
    const cargo = await this.prisma.cargos.findUnique({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo no encontrado');
    return this.present(cargo);
  }

  async update(id: string, dto: UpdateCargoDto, user: any) {
    const cargo = await this.prisma.cargos.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!cargo) throw new NotFoundException('Cargo no encontrado');

    const isSuperadmin = user.roles.includes('SUPERADMIN');
    const belongsToTenant = cargo.tenant.slug === user.tenant;

    if (!isSuperadmin && !belongsToTenant) {
      throw new ForbiddenException('No tienes acceso a modificar este cargo');
    }

    const updated = await this.prisma.cargos.update({
      where: { id },
      data: {
        nombre: dto.nombre?.trim(),
        competenciasJson: dto.competencias
          ? JSON.stringify(dto.competencias)
          : undefined,
      },
    });

    return this.present(updated);
  }

}
