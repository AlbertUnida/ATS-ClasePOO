// src/postulaciones/postulaciones.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreatePostulacionDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const vacante = await this.prisma.vacantes.findUnique({ where: { id: dto.vacanteId } });
    if (!vacante || vacante.tenantId !== tenant.id) {
      throw new BadRequestException('vacanteId inválido para este tenant');
    }

    const candidato = await this.prisma.candidatos.findUnique({ where: { id: dto.candidatoId } });
    if (!candidato || candidato.tenantId !== tenant.id) {
      throw new BadRequestException('candidatoId inválido para este tenant');
    }

    try {
      return await this.prisma.postulaciones.create({
        data: {
          tenantId: tenant.id,
          vacanteId: vacante.id,
          candidatoId: candidato.id,
          fuente: dto.fuente,
          // estadoActual por defecto "CREADA" (del schema)
        },
        include: { vacante: true, candidato: true },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('El candidato ya está postulado a esa vacante');
      throw e;
    }
  }

  async list(tenantSlug: string, vacanteId?: string, candidatoId?: string, estado?: string) {
    const t = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!t) throw new NotFoundException('Tenant no encontrado');

    return this.prisma.postulaciones.findMany({
      where: {
        tenantId: t.id,
        ...(vacanteId ? { vacanteId } : {}),
        ...(candidatoId ? { candidatoId } : {}),
        ...(estado ? { estadoActual: estado } : {}),
      },
      include: { vacante: true, candidato: true },
      orderBy: { createdAt: 'desc' },
    });
  }

}
