import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, JWT_SECRET, JWT_REFRESH_SECRET,
  COOKIE_DOMAIN, COOKIE_SECURE,
} from './auth.constants';
import { ConflictException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) { }

  // Login para cualquier usuario (incluye SUPERADMIN en tenant 'root')
  async validateLogin(email: string, password: string, tenantSlug?: string, fallbackTenantSlug?: string) {
    const emailLower = email.toLowerCase();
    const slug = tenantSlug ?? fallbackTenantSlug;

    // 1) Si vino slug → login directo en ese tenant
    if (slug) return this.tryLoginOnTenant(emailLower, password, slug);

    // 2) Intento SUPERADMIN en root (permite que el superadmin no pase slug)
    const root = await this.prisma.tenants.findUnique({ where: { slug: 'root' } });
    if (root) {
      const uRoot = await this.prisma.usuarios.findFirst({
        where: { tenantId: root.id, email: emailLower, active: true },
        include: { roles: { include: { role: true } } },
      });
      if (uRoot && await argon2.verify(uRoot.password, password)) {
        const roles = uRoot.roles.map(r => r.role.name);
        if (roles.includes('SUPERADMIN')) {
          return this.buildPayload(uRoot, root, roles, true);
        }
      }
    }

    // 3) Conveniencia: email pertenece a un único tenant activo
    const matches = await this.prisma.usuarios.findMany({
      where: { email: emailLower, active: true },
      select: { tenantId: true },
      take: 2, // clave: no necesitamos más de 2 para saber si es único
    });
    const tenantIds = Array.from(new Set(matches.map(m => m.tenantId)));
    if (tenantIds.length === 1) {
      const t = await this.prisma.tenants.findUnique({ where: { id: tenantIds[0] } });
      if (t) return this.tryLoginOnTenant(emailLower, password, t.slug);
    }

    // 4) Ambiguo o inexistente → exigir tenant
    throw new BadRequestException('Debe indicar la empresa (tenant).');
  }

  // Igual que la tuya
  private async tryLoginOnTenant(email: string, password: string, slug: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!tenant) throw new BadRequestException('Tenant inválido');

    const user = await this.prisma.usuarios.findFirst({
      where: { email, tenantId: tenant.id, active: true },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const roles = user.roles.map(r => r.role.name);
    const isSuperAdmin = roles.includes('SUPERADMIN') && tenant.slug === 'root';
    return this.buildPayload(user, tenant, roles, isSuperAdmin);
  }

  private buildPayload(user: any, tenant: any, roles: string[], isSuperAdmin: boolean) {
    const perms: string[] = isSuperAdmin ? ['*'] : [];
    const payload = { sub: user.id, tid: tenant.id, roles, perms, isSuperAdmin, email: user.email, tenant: tenant.slug };
    return { user, tenant, payload };
  }

  signAccess(payload: any) {
    return this.jwt.sign(payload, { secret: JWT_SECRET, expiresIn: ACCESS_TOKEN_TTL });
  }

  signRefresh(payload: { sub: string; tid: string; }) {
    return this.jwt.sign(payload, { secret: JWT_REFRESH_SECRET, expiresIn: REFRESH_TOKEN_TTL });
  }

  cookieOpts(maxAgeMs?: number) {
    return {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SECURE ? ('none' as const) : ('lax' as const),
      domain: COOKIE_DOMAIN,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  ttlToMs(ttl: string) {
    const m = ttl.match(/^(\d+)([smhd])$/i);
    if (!m) return 0; const n = +m[1], u = m[2].toLowerCase();
    return n * (u === 's' ? 1000 : u === 'm' ? 60000 : u === 'h' ? 3600000 : 86400000);
  }

  async bootstrapCreateSuperadmin(dto: { name: string; email: string; password: string; }) {
    const root = await this.prisma.tenants.upsert({
      where: { slug: 'root' }, update: {}, create: { name: 'Root', slug: 'root' },
    });
    const superRole = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: root.id, name: 'SUPERADMIN' } },
      update: {}, create: { tenantId: root.id, name: 'SUPERADMIN' },
    });

    // permitir solo si aún no hay SUPERADMIN
    const exists = await this.prisma.usuarioRoles.findFirst({ where: { roleId: superRole.id } });
    if (exists) throw new ForbiddenException('Ya existe un superadministrador');

    const email = dto.email.toLowerCase();
    const hash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.usuarios.create({
        data: { tenantId: root.id, name: dto.name, email, password: hash, active: true },
      });
      await this.prisma.usuarioRoles.create({ data: { userId: user.id, roleId: superRole.id } });

      const payload = { sub: user.id, tid: root.id, roles: ['SUPERADMIN'], perms: ['*'], isSuperAdmin: true };
      return { user, tenant: { slug: 'root', id: root.id }, payload };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Email ya existe en root');
      throw e;
    }
  }

  async adminCreateOrPromoteSuperadmin(dto: { name: string; email: string; password?: string }) {
    const root = await this.prisma.tenants.upsert({
      where: { slug: 'root' }, update: {}, create: { name: 'Root', slug: 'root' },
    });
    const superRole = await this.prisma.roles.upsert({
      where: { tenantId_name: { tenantId: root.id, name: 'SUPERADMIN' } },
      update: {}, create: { tenantId: root.id, name: 'SUPERADMIN' },
    });

    const email = dto.email.toLowerCase();
    const dataUpdate: any = { name: dto.name };
    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await argon2.hash(dto.password);
      dataUpdate.password = passwordHash;
    }

    // crea o actualiza usuario en root
    const user = await this.prisma.usuarios.upsert({
      where: { tenantId_email: { tenantId: root.id, email } },
      update: dataUpdate,
      create: {
        tenantId: root.id,
        name: dto.name,
        email,
        password: passwordHash ?? (await argon2.hash(Math.random().toString(36).slice(2))), // por si no envían password
        active: true,
      },
    });

    // asigna rol SUPERADMIN (idempotente)
    await this.prisma.usuarioRoles.upsert({
      where: { userId_roleId: { userId: user.id, roleId: superRole.id } },
      update: {},
      create: { userId: user.id, roleId: superRole.id },
    });

    return user;
  }

  async createTenantUser(dto: {
    name: string;
    email: string;
    password: string;
    tenantSlug?: string;
    roleId?: string;
    roleName?: string;
    candidatoId?: string;
  }) {
    // ✅ 1) exigir y normalizar el slug
    const slug = dto.tenantSlug?.toString().trim().toLowerCase();
    if (!slug) throw new BadRequestException('tenantSlug es requerido');

    // ✅ 2) buscar el tenant por el slug ya normalizado
    const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!tenant) throw new BadRequestException('Tenant inválido');

    // 🔎 Validación opcional del candidato
    let candidateIdToLink: string | null = null;
    if (dto.candidatoId) {
      const cand = await this.prisma.candidatos.findUnique({ where: { id: dto.candidatoId } });
      if (!cand || cand.tenantId !== tenant.id) {
        throw new BadRequestException('Candidato inválido para este tenant');
      }
      const alreadyLinked = await this.prisma.usuarios.findFirst({
        where: { tenantId: tenant.id, candidatoId: dto.candidatoId },
      });
      if (alreadyLinked) throw new ConflictException('Este candidato ya tiene un usuario');
      candidateIdToLink = cand.id;
    }

    // 🔐 Resolver rol
    let role;
    if (dto.roleId) {
      role = await this.prisma.roles.findUnique({ where: { id: dto.roleId } });
      if (!role || role.tenantId !== tenant.id) throw new BadRequestException('Rol inválido para este tenant');
      if (role.name === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN se crea solo por flujo dedicado');
    } else {
      const normalized = (dto.roleName ?? 'CANDIDATO').trim().toUpperCase().replace(/-/g, '_');
      if (normalized === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN se crea solo por flujo dedicado');
      role = await this.prisma.roles.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: normalized } },
        update: {},
        create: { tenantId: tenant.id, name: normalized },
      });
    }

    const email = dto.email.toLowerCase();
    const hash = await argon2.hash(dto.password);

    try {
      const user = await this.prisma.usuarios.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email,
          password: hash,
          active: true,
          candidatoId: candidateIdToLink,
        },
      });

      await this.prisma.usuarioRoles.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });

      const { password, ...safe } = user as any;
      return { ...safe, roles: [role.name], tenant: { id: tenant.id, slug: tenant.slug } };
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Email ya existe en este tenant');
      if (e.code === 'P2003') throw new BadRequestException('FK inválida (revisa candidatoId/tenant)');
      throw e;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

}
