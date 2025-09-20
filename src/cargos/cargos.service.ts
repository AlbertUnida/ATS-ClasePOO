import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(dto: CreateCargoDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const cargo = await this.prisma.cargos.create({
      data: {
        tenantId: tenant.id,
        nombre: dto.nombre, // ya viene trim del DTO (Transform + ValidationPipe)
        competenciasJson: dto.competencias ? JSON.stringify(dto.competencias) : undefined,
      },
    });
    return this.present(cargo);
  }

  async listByTenant(tenantSlug: string) {
    const t = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!t) throw new NotFoundException('Tenant no encontrado');

    const rows = await this.prisma.cargos.findMany({
      where: { tenantId: t.id },
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
}
