// src/postulaciones/postulaciones.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';
import { AutomationsService } from '../automations/automations.service';

@Injectable()
export class PostulacionesService {
  constructor(private prisma: PrismaService, private automations: AutomationsService) {}

  /**
   * Crea una nueva postulación.
   * - Valida tenant, vacante y candidato
   * - Previene duplicados
   * - Registra evento de postulación inicial
   */
  async create(
    dto: CreatePostulacionDto,
    candidatoId: string,
    userContext: {
      userId?: string;
      accountId?: string;
      email?: string;
      ip?: string;
      userAgent?: string;
      path?: string;
    },
  ) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const vacante = await this.prisma.vacantes.findUnique({
      where: { id: dto.vacanteId },
    });
    if (!vacante || vacante.tenantId !== tenant.id) {
      throw new BadRequestException('Vacante inválida para este tenant');
    }

    let candidato = await this.prisma.candidatos.findUnique({
      where: { id: candidatoId },
    });
    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    if (!candidato.tenantId) {
      candidato = await this.prisma.candidatos.update({
        where: { id: candidato.id },
        data: { tenantId: tenant.id },
      });
    } else if (candidato.tenantId !== tenant.id) {
      throw new BadRequestException('Candidato inválido para este tenant');
    }

    try {
      const postulacion = await this.prisma.postulaciones.create({
        data: {
          tenantId: tenant.id,
          vacanteId: vacante.id,
          candidatoId: candidato.id,
          fuente: dto.fuente,
          mensaje: dto.mensaje,
          cvExtraUrl: dto.cvExtraUrl,
          estado: 'postulado',
          createdByUserId: userContext.userId,
          createdByAccountId: userContext.accountId,
        },
        include: {
          vacante: true,
          candidato: true,
        },
      });

      await this.prisma.eventoPostulaciones.create({
        data: {
          tenantId: tenant.id,
          postulacionId: postulacion.id,
          estadoFrom: null,
          estadoTo: 'postulado',
          motivo: 'Postulación inicial',
        },
      });

      await this.prisma.auditLog.create({
        data: {
          tenantId: tenant.id,
          actorUserId: userContext.userId,
          actorAccountId: userContext.accountId,
          actorEmail: userContext.email,
          action: 'CREATE',
          entity: 'Postulaciones',
          entityId: postulacion.id,
          note: `Candidato se postuló a vacante "${vacante.id}"`,
          ip: userContext.ip,
          userAgent: userContext.userAgent,
          path: userContext.path,
        },
      });

      await this.automations.executeTrigger(tenant.id, 'postulacion.creada', {
        postulacion,
        candidato,
        vacante,
      });

      return postulacion;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('El candidato ya está postulado a esta vacante');
      }
      throw e;
    }
  }

  /**
   * Lista postulaciones filtrando por tenant, vacante, candidato o estado.
   */
  async list(
    tenantSlug: string,
    filters: {
      vacanteId?: string;
      candidatoId?: string;
      estado?: string;
    },
  ) {
    const t = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });
    if (!t) throw new NotFoundException('Tenant no encontrado');

    const where: any = {
      tenantId: t.id,
    };
    if (filters.vacanteId) where.vacanteId = filters.vacanteId;
    if (filters.candidatoId) where.candidatoId = filters.candidatoId;
    if (filters.estado) where.estado = filters.estado;

    return this.prisma.postulaciones.findMany({
      where,
      include: {
        vacante: true,
        candidato: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
