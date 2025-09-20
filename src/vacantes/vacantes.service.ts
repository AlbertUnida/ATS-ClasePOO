import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';

@Injectable()
export class VacantesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateVacanteDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const cargo = await this.prisma.cargos.findUnique({ where: { id: dto.cargoId } });
    if (!cargo || cargo.tenantId !== tenant.id) {
      throw new BadRequestException('cargoId inválido para este tenant');
    }

    const estado = (dto.estado ?? 'abierta') as 'abierta' | 'pausada' | 'cerrada';

    return this.prisma.vacantes.create({
      data: {
        tenantId: tenant.id,
        cargoId: cargo.id,
        ubicacion: dto.ubicacion,
        tipoContrato: dto.tipoContrato,
        estado,
        flujoAprobacionJson: dto.flujoAprobacion ? JSON.stringify(dto.flujoAprobacion) : undefined,
      },
      include: { cargo: true },
    });
  }

  async list(tenantSlug: string, estado?: string) {
    const t = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!t) throw new NotFoundException('Tenant no encontrado');

    const filtros: any = { tenantId: t.id };
    if (estado) {
      const normalized = estado.toLowerCase();
      if (!['abierta', 'pausada', 'cerrada'].includes(normalized)) {
        throw new BadRequestException('estado inválido');
      }
      filtros.estado = normalized;
    }

    return this.prisma.vacantes.findMany({
      where: filtros,
      include: { cargo: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}