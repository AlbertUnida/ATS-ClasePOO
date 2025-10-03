import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateEntrevistaDto } from './dto/create-entrevista.dto';
import { UpdateEntrevistaDto } from './dto/update-entrevista.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EntrevistasService {
  constructor(private prisma: PrismaService) { }

  /**
   * Crea una nueva entrevista.
   * - Valida tenant
   * - Valida postulación existente
   * - Registra entrevista y opcionalmente log de auditoría
   */
  async create(dto: CreateEntrevistaDto, userContext: {
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

    const entrevista = await this.prisma.entrevistas.create({
      data: {
        tenantId: tenant.id,
        postulacionId: dto.postulacionId,
        tipo: dto.tipo,
        inicioTs: new Date(dto.inicioTs),
        finTs: new Date(dto.finTs),
        canal: dto.canal,
        resultado: dto.resultado,
        notas: dto.notas,
      },
    });

    // (Opcional) registrar en AuditLog
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: userContext.userId,
        actorAccountId: userContext.accountId,
        actorEmail: userContext.email,
        action: 'CREATE',
        entity: 'Entrevistas',
        entityId: entrevista.id,
        note: `Entrevista registrada para postulación "${dto.postulacionId}"`,
        ip: userContext.ip,
        userAgent: userContext.userAgent,
        path: userContext.path,
      },
    });

    return entrevista;
  }

  // Otros métodos (para luego)
  async findAllByTenant(tenantSlug: string, filters?: {
    postulacionId?: string;
    tipo?: string;
    resultado?: string;
  }) {
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    return this.prisma.entrevistas.findMany({
      where: {
        tenantId: tenant.id,
        ...(filters?.postulacionId && { postulacionId: filters.postulacionId }),
        ...(filters?.tipo && { tipo: filters.tipo }),
        ...(filters?.resultado && { resultado: filters.resultado }),
      },
      orderBy: { inicioTs: 'desc' },
    });
  }

  async findOne(id: string, tenantId?: string, isSuperAdmin?: boolean) {
    const entrevista = await this.prisma.entrevistas.findUnique({
      where: { id },
    });

    if (!entrevista) throw new NotFoundException('Entrevista no encontrada');

    if (!isSuperAdmin && tenantId && entrevista.tenantId !== tenantId) {
      throw new ForbiddenException('Acceso denegado');
    }

    return entrevista;
  }

  update(id: string, dto: Partial<CreateEntrevistaDto>) {
    return this.prisma.entrevistas.update({
      where: { id },
      data: dto,
    });
  }

  // remove(id: string) {
  //   return this.prisma.entrevistas.delete({
  //     where: { id },
  //   });
  // }
}
