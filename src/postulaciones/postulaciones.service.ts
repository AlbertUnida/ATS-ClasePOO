// src/postulaciones/postulaciones.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';
import { AutomationsService } from '../automations/automations.service';
import { ScoringService } from '../scoring/scoring.service';

const FORMACION_SCORES: Record<string, number> = {
  secundaria: 20,
  tecnico: 40,
  universitario_incompleto: 60,
  universitario: 80,
  universitario_completo: 80,
  pregrado: 70,
  postgrado: 100,
  maestria: 95,
  doctorado: 100,
};

@Injectable()
export class PostulacionesService {
  constructor(
    private prisma: PrismaService,
    private automations: AutomationsService,
    private scoring: ScoringService,
  ) {}

  private parsePerfil(perfilJson?: string | null) {
    if (!perfilJson) return undefined;
    try {
      return JSON.parse(perfilJson);
    } catch {
      return undefined;
    }
  }

  private buildSnapshot(
    dto: CreatePostulacionDto,
    perfilActual?: Record<string, any>,
  ) {
    const hasFormacion =
      typeof dto.formacionNivel === 'string' &&
      dto.formacionNivel.trim().length > 0;
    const hasExperiencia =
      typeof dto.anosExperiencia === 'number' &&
      !Number.isNaN(dto.anosExperiencia);

    const provided =
      hasFormacion ||
      hasExperiencia ||
      (dto.habilidadesTecnicas?.length ?? 0) > 0 ||
      (dto.competenciasBlandas?.length ?? 0) > 0 ||
      (dto.palabrasClave?.length ?? 0) > 0;

    if (!provided) return null;

    const formacionNivel = dto.formacionNivel ?? perfilActual?.formacionNivel;
    const anosExperiencia =
      dto.anosExperiencia ?? perfilActual?.anosExperiencia;
    const habilidadesTecnicas = dto.habilidadesTecnicas?.length
      ? dto.habilidadesTecnicas
      : (perfilActual?.habilidadesDetalle ?? []);
    const competenciasBlandas = dto.competenciasBlandas?.length
      ? dto.competenciasBlandas
      : (perfilActual?.competenciasDetalle ?? []);
    const palabrasClave = dto.palabrasClave?.length
      ? dto.palabrasClave
      : (perfilActual?.palabrasClaveDetalle ?? []);

    const metricas = {
      formacionScore: formacionNivel
        ? (FORMACION_SCORES[formacionNivel] ?? 0)
        : 0,
      habilidadesMatch: Math.min((habilidadesTecnicas?.length ?? 0) * 20, 100),
      competenciasMatch: Math.min((competenciasBlandas?.length ?? 0) * 20, 100),
      palabrasClaveMatch: Math.min((palabrasClave?.length ?? 0) * 15, 100),
    };

    const snapshot = {
      formacionNivel,
      anosExperiencia,
      habilidadesTecnicas,
      competenciasBlandas,
      palabrasClave,
      metricas,
    };

    const perfilActualizado = {
      ...(perfilActual ?? {}),
      formacionNivel,
      formacionScore: metricas.formacionScore,
      anosExperiencia,
      experiencia: {
        ...(perfilActual?.experiencia ?? {}),
        anios: anosExperiencia ?? perfilActual?.experiencia?.anios,
      },
      habilidadesDetalle: habilidadesTecnicas,
      habilidadesMatch: metricas.habilidadesMatch,
      competenciasDetalle: competenciasBlandas,
      competenciasMatch: metricas.competenciasMatch,
      palabrasClaveDetalle: palabrasClave,
      palabrasClaveMatch: metricas.palabrasClaveMatch,
    };

    return { snapshot, perfilActualizado };
  }

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

    const perfilActual = this.parsePerfil(candidato.perfilJson);
    const snapshot = this.buildSnapshot(dto, perfilActual);

    if (snapshot) {
      await this.prisma.candidatos.update({
        where: { id: candidato.id },
        data: {
          perfilJson: JSON.stringify(snapshot.perfilActualizado),
        },
      });
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
          matchDetailsJson: snapshot
            ? JSON.stringify(snapshot.snapshot)
            : undefined,
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

      await this.scoring
        .recalcularCandidato(candidato.id)
        .catch(() => undefined);

      return postulacion;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          'El candidato ya está postulado a esta vacante',
        );
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
