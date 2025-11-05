import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';
import { promises as fs } from 'fs';
import { join } from 'path';

const UPLOADS_PREFIX = '/uploads/';

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
        imagenUrl: dto.imagenUrl,
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

  async update(id: string, dto: UpdateVacanteDto, user: any) {
    const vacante = await this.prisma.vacantes.findUnique({ where: { id } });

    if (!vacante || vacante.deletedAt) {
      throw new NotFoundException('Vacante no encontrada o eliminada');
    }

    const isSuperAdmin = user.roles.includes('SUPERADMIN');
    const tenant = await this.prisma.tenants.findUnique({ where: { id: vacante.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (!isSuperAdmin && tenant.slug !== user.tenant) {
      throw new ForbiddenException('No tienes acceso a esta vacante');
    }
    if (!isSuperAdmin && vacante.createdByUserId && vacante.createdByUserId !== user.id) {
      throw new ForbiddenException('Solo el creador de la vacante o un superadmin pueden editarla');
    }

    // Validar nuevo cargoId si lo quiere cambiar
    if (dto.cargoId && dto.cargoId !== vacante.cargoId) {
      const nuevoCargo = await this.prisma.cargos.findUnique({ where: { id: dto.cargoId } });
      if (!nuevoCargo || nuevoCargo.tenantId !== tenant.id) {
        throw new BadRequestException('cargoId inválido o no pertenece al tenant');
      }
    }

    // Validar estado si lo quiere cambiar
    if (dto.estado && !['abierta', 'pausada', 'cerrada'].includes(dto.estado)) {
      throw new BadRequestException('estado inválido');
    }

    const dataToUpdate: any = {
      cargoId: dto.cargoId,
      ubicacion: dto.ubicacion,
      tipoContrato: dto.tipoContrato,
      estado: dto.estado,
      flujoAprobacionJson: dto.flujoAprobacion ? JSON.stringify(dto.flujoAprobacion) : undefined,
      updatedByUserId: user?.id,
      imagenUrl: dto.imagenUrl,
    };

    // Quitar campos undefined para no sobreescribir nulos
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) delete dataToUpdate[key];
    });

    const updated = await this.prisma.vacantes.update({
      where: { id },
      data: dataToUpdate,
      include: { cargo: true },
    });

    // (Opcional) log de auditoría
    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        actorUserId: user?.id,
        actorEmail: user?.email,
        action: 'UPDATE',
        entity: 'Vacantes',
        entityId: updated.id,
        note: 'Actualización de vacante',
      },
    });

    return updated;
  }

  async updateImagen(id: string, imagenUrl: string, user: any) {
    const vacante = await this.prisma.vacantes.findUnique({ where: { id } });
    if (!vacante || vacante.deletedAt) {
      throw new NotFoundException('Vacante no encontrada o eliminada');
    }
    const isSuperAdmin = user.roles.includes('SUPERADMIN');
    const tenant = await this.prisma.tenants.findUnique({ where: { id: vacante.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    if (!isSuperAdmin && tenant.slug !== user.tenant) {
      throw new ForbiddenException('No tienes acceso a esta vacante');
    }
    if (!isSuperAdmin && vacante.createdByUserId && vacante.createdByUserId !== user.id) {
      throw new ForbiddenException('Solo el creador de la vacante o un superadmin pueden actualizar la imagen');
    }

    const updated = await this.prisma.vacantes.update({
      where: { id },
      data: {
        imagenUrl,
        updatedByUserId: user?.id,
      },
      include: { cargo: true },
    });

    if (vacante.imagenUrl && vacante.imagenUrl !== imagenUrl) {
      await this.removeLocalFileIfExists(vacante.imagenUrl).catch(() => undefined);
    }

    return updated;
  }

  private async removeLocalFileIfExists(url: string) {
    if (!url.startsWith(UPLOADS_PREFIX)) return;
    const relative = url.replace(/^\//, '');
    const absolutePath = join(process.cwd(), relative);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // ignore cleanup errors
    }
  }
}
