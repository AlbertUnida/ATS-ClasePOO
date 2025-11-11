import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DateRange = {
  from?: Date;
  to?: Date;
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async resolveTenant(tenantSlug: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async overview(tenantSlug: string, range?: DateRange) {
    if (!tenantSlug) {
      throw new BadRequestException('tenant es requerido');
    }
    const tenant = await this.resolveTenant(tenantSlug);

    const dateFilter: Record<string, any> = {};
    if (range?.from || range?.to) {
      dateFilter.createdAt = {};
      if (range.from) dateFilter.createdAt.gte = range.from;
      if (range.to) dateFilter.createdAt.lte = range.to;
    }

    const [totalVacantes, vacantesAbiertas, totalCandidatos, totalPostulaciones, postulacionesPorEstadoRaw, entrevistasProximas] =
      await this.prisma.$transaction([
        this.prisma.vacantes.count({
          where: { tenantId: tenant.id, ...dateFilter },
        }),
        this.prisma.vacantes.count({
          where: { tenantId: tenant.id, estado: 'abierta', ...dateFilter },
        }),
        this.prisma.candidatos.count({
          where: { tenantId: tenant.id, deletedAt: null, ...dateFilter },
        }),
        this.prisma.postulaciones.count({
          where: { tenantId: tenant.id, ...dateFilter },
        }),
        this.prisma.postulaciones.groupBy({
          by: ['estado'],
          where: { tenantId: tenant.id, ...dateFilter },
          _count: { estado: true },
          orderBy: { estado: 'asc' },
        }),
        this.prisma.entrevistas.count({
          where: {
            tenantId: tenant.id,
            inicioTs: { gte: new Date() },
          },
        }),
      ]);

    const postulacionesPorEstado = postulacionesPorEstadoRaw.map((item) => ({
      estado: item.estado,
      total: typeof item._count === 'object' && item._count !== null ? (item._count as any).estado ?? 0 : 0,
    }));

    const contratadas = await this.prisma.postulaciones.findMany({
      where: { tenantId: tenant.id, estado: 'contratado' },
      select: { createdAt: true, updatedAt: true },
    });
    const promedioDiasContratacion =
      contratadas.length > 0
        ? Number(
            (
              contratadas.reduce(
                (acc, item) => acc + (item.updatedAt.getTime() - item.createdAt.getTime()),
                0,
              ) /
              contratadas.length /
              (1000 * 60 * 60 * 24)
            ).toFixed(1),
          )
        : null;

    const timeline = await this.buildTimeline(tenant.id);

    return {
      tenant: tenant.slug,
      totals: {
        vacantes: totalVacantes,
        vacantesAbiertas,
        candidatos: totalCandidatos,
        postulaciones: totalPostulaciones,
        entrevistasProximas,
        promedioDiasContratacion,
      },
      postulacionesPorEstado,
      timeline,
    };
  }

  private async buildTimeline(tenantId: string) {
    const now = new Date();
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' });
      months.push({ key, label: formatter.format(date) });
    }

    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const items = await this.prisma.postulaciones.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const counts: Record<string, number> = {};
    months.forEach(({ key }) => (counts[key] = 0));
    items.forEach((item) => {
      const key = `${item.createdAt.getFullYear()}-${(item.createdAt.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    });

    return months.map(({ key, label }) => ({
      period: label,
      total: counts[key] ?? 0,
    }));
  }
}
