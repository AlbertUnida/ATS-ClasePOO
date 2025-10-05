import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';

@Injectable()
export class VacantesService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateVacanteDto, user: any) {
    const isSuperAdmin = user.roles.includes('SUPERADMIN');

    // 🔍 Obtener el cargo para validar el tenant
    const cargo = await this.prisma.cargos.findUnique({ where: { id: dto.cargoId } });
    if (!cargo) {
      throw new BadRequestException('cargoId inválido');
    }

    const tenant = await this.prisma.tenants.findUnique({ where: { id: cargo.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    // 🔐 Verificar si el usuario tiene permiso sobre ese tenant
    if (!isSuperAdmin && user.tenant !== tenant.slug) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }
    
    const estado = (dto.estado ?? 'abierta') as 'abierta' | 'pausada' | 'cerrada';

    const vacante = await this.prisma.vacantes.create({
      data: {
        tenantId: tenant.id,
        cargoId: cargo.id,
        ubicacion: dto.ubicacion,
        tipoContrato: dto.tipoContrato,
        estado,
        flujoAprobacionJson: dto.flujoAprobacion ? JSON.stringify(dto.flujoAprobacion) : undefined,
        createdByUserId: user?.id, // opcional
      },
      include: { cargo: true },
    });

    // (Opcional) log en AuditLog
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: user?.id,
        actorEmail: user?.email,
        action: 'CREATE',
        entity: 'Vacantes',
        entityId: vacante.id,
        note: `Creación de vacante para cargo ${cargo.nombre}`,
      },
    });

    return vacante;
  }


  async list(tenantSlug: string, user: any, estado?: string) {
    const userTenantSlug = user.tenant;

    if (!user.roles.includes('SUPERADMIN') && userTenantSlug !== tenantSlug) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }

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

  async listPublicasTenantOnly(tenantSlug: string) {
    const t = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!t) throw new NotFoundException('Tenant no encontrado');

    return this.prisma.vacantes.findMany({
      where: {
        tenantId: t.id,
        estado: 'abierta',
        visibilidad: 'PUBLICA',
        deletedAt: null,
      },
      include: {
        cargo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listTodasPublicas() {
    return this.prisma.vacantes.findMany({
      where: {
        estado: 'abierta',
        visibilidad: 'PUBLICA',
        deletedAt: null,
      },
      include: {
        cargo: true,
        tenant: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }


}