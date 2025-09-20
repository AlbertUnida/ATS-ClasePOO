import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { extractSubdomain } from '../utils/subdomain.util';

@Injectable()
export class TenantResolver implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: any, _res: any, next: Function) {
    const slugHeader = req.header?.('X-Tenant-Slug') ?? req.headers?.['x-tenant-slug'];
    const slug = slugHeader ?? extractSubdomain(req.hostname);

    if (slug) {
      const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
      if (!tenant) throw new ForbiddenException('Tenant inválido');
      req.tenant = { id: tenant.id, slug: tenant.slug };
    }
    // si no hay slug, lo dejamos pasar (p.ej. login al tenant root o públicos)
    next();
  }
}

