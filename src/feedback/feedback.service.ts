import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateFeedbackDto, userContext: {
    userId?: string;
    accountId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    path?: string;
  }) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    const postulacion = await this.prisma.postulaciones.findUnique({
      where: { id: dto.postulacionId },
    });

    if (!postulacion || postulacion.tenantId !== tenant.id) {
      throw new BadRequestException('Postulación inválida para este tenant');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        tenantId: tenant.id,
        postulacionId: dto.postulacionId,
        evaluadorUserId: userContext.userId,
        puntaje: dto.puntaje,
        competenciasJson: dto.competenciasJson,
        comentario: dto.comentario,
        recomendacion: dto.recomendacion,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: userContext.userId,
        actorAccountId: userContext.accountId,
        actorEmail: userContext.email,
        action: 'CREATE',
        entity: 'Feedback',
        entityId: feedback.id,
        note: `Feedback creado para postulación "${dto.postulacionId}"`,
        ip: userContext.ip,
        userAgent: userContext.userAgent,
        path: userContext.path,
      },
    });

    return feedback;
  }

  async findAllByTenant(tenantSlug: string, filters?: {
    postulacionId?: string;
    evaluadorUserId?: string;
  }) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    return this.prisma.feedback.findMany({
      where: {
        tenantId: tenant.id,
        ...(filters?.postulacionId && { postulacionId: filters.postulacionId }),
        ...(filters?.evaluadorUserId && { evaluadorUserId: filters.evaluadorUserId }),
      },
      orderBy: { ts: 'desc' },
    });
  }

  async findOne(id: string, tenantId?: string, isSuperAdmin = false) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) throw new NotFoundException('Feedback no encontrado');

    if (!isSuperAdmin && tenantId && feedback.tenantId !== tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    return feedback;
  }

  async update(
    id: string,
    dto: Partial<CreateFeedbackDto>,
    user: {
      id: string;
      isSuperAdmin?: boolean;
      tenantId?: string;
      roles?: string[];
    }
  ) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) throw new NotFoundException('Feedback no encontrado');

    // 🔐 Validar acceso al tenant
    if (!user.isSuperAdmin && feedback.tenantId !== user.tenantId) {
      throw new ForbiddenException('No tienes acceso a este feedback');
    }

    // 🔐 Permitir si es el evaluador, superadmin o ADMIN del tenant
    const isAdmin = user.roles?.includes('ADMIN');
    const isEvaluador = feedback.evaluadorUserId === user.id;

    if (!user.isSuperAdmin && !isEvaluador && !isAdmin) {
      throw new ForbiddenException('Solo el evaluador o un admin pueden editar este feedback');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: {
        puntaje: dto.puntaje,
        competenciasJson: dto.competenciasJson,
        comentario: dto.comentario,
        recomendacion: dto.recomendacion,
      },
    });
  }

}

