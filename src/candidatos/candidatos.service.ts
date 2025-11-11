import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { PostulacionesService } from '../postulaciones/postulaciones.service';
import { CreatePostulacionDto } from '../postulaciones/dto/create-postulacione.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';

const UPLOADS_PREFIX = '/uploads/';

@Injectable()
export class CandidatosService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private postulacionesService: PostulacionesService,
  ) {}

  private present(c: any) {
    const perfil = c.perfilJson ? JSON.parse(c.perfilJson) : undefined;
    const { perfilJson, ...rest } = c;
    return { ...rest, perfil };
  }

  private async removeLocalFileIfExists(url: string) {
    if (!url?.startsWith(UPLOADS_PREFIX)) return;
    const relative = url.replace(/^\//, '');
    const absolute = join(process.cwd(), relative);
    try {
      await fs.unlink(absolute);
    } catch {
      // noop
    }
  }

  async create(dto: CreateCandidatoDto) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    try {
      const cand = await this.prisma.candidatos.create({
        data: {
          tenantId: tenant.id,
          nombre: dto.nombre.trim(),
          email: dto.email.toLowerCase(),
          telefono: dto.telefono,
          cvUrl: dto.cvUrl,
          perfilJson: dto.perfil ? JSON.stringify(dto.perfil) : undefined,
        },
      });

      return this.present(cand);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un candidato con ese email en este tenant');
      throw e;
    }
  }

  async register(dto: CandidateRegisterDto) {
    const exists = await this.prisma.candidatoCuentas.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese email');

    const hashedPassword = await this.authService.hashPassword(dto.password);
    const cuenta = await this.prisma.candidatoCuentas.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
      },
    });

    let tenantId: string | undefined;
    if (dto.tenantSlug) {
      const tenant = await this.prisma.tenants.findUnique({
        where: { slug: dto.tenantSlug },
      });
      if (!tenant) throw new NotFoundException('Tenant no encontrado');
      tenantId = tenant.id;
    }

    const candidato = await this.prisma.candidatos.create({
      data: {
        nombre: dto.name,
        email: dto.email.toLowerCase(),
        telefono: dto.telefono,
        cvUrl: dto.cvUrl,
        cuentaId: cuenta.id,
        tenantId,
      },
    });

    return this.present(candidato);
  }

  async login(dto: CandidateLoginDto, res: Response) {
    const cuenta = await this.prisma.candidatoCuentas.findUnique({
      where: { email: dto.email },
      include: { candidatos: true },
    });

    if (!cuenta) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await this.authService.comparePassword(dto.password, cuenta.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: cuenta.id,
      email: cuenta.email,
    };

    const accessToken = await this.authService.signAccess(payload);
    res.cookie('access_token', accessToken, this.authService.cookieOpts());

    return {
      access_token: accessToken,
      message: 'Login exitoso',
      payload,
    };
  }

  async findByCuentaId(cuentaId: string, includePostulaciones = false) {
    if (includePostulaciones) {
      const candidato = await this.prisma.candidatos.findFirst({
        where: { cuentaId },
        include: {
          postulaciones: {
            include: {
              vacante: {
                include: {
                  tenant: { select: { name: true } },
                  cargo: true,
                },
              },
              eventos: true,
              entrevistas: true,
              feedbacks: true,
            },
          },
        },
      });

      if (!candidato) throw new NotFoundException('Candidato no encontrado');

      return {
        postulaciones: candidato.postulaciones,
      };
    }

    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    return {
      ...this.present(candidato),
      tipoUsuario: 'candidato',
    };
  }

  async updateByCuentaId(cuentaId: string, dto: UpdateCandidatoDto) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    const updated = await this.prisma.candidatos.update({
      where: { id: candidato.id },
      data: {
        nombre: dto.nombre,
        telefono: dto.telefono,
        cvUrl: dto.cvUrl,
        perfilJson: dto.perfil ? JSON.stringify(dto.perfil) : undefined,
      },
    });

    return this.present(updated);
  }

  async postularDesdeCandidatoCuenta(
    cuentaId: string,
    dto: CreatePostulacionDto,
    userContext: any,
  ) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });
    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    return this.postulacionesService.create(dto, candidato.id, userContext);
  }

  async updateCvFromUpload(cuentaId: string, cvPath: string) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });
    if (!candidato) throw new NotFoundException('Candidato no encontrado');

    const updated = await this.prisma.candidatos.update({
      where: { id: candidato.id },
      data: {
        cvUrl: cvPath,
      },
    });

    if (candidato.cvUrl && candidato.cvUrl !== cvPath) {
      await this.removeLocalFileIfExists(candidato.cvUrl).catch(() => undefined);
    }

    return this.present(updated);
  }

  async listByTenant(
    tenantSlug: string,
    params: { search?: string; page?: number; limit?: number } = {},
  ) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: tenant.id,
      deletedAt: null,
    };

    if (params.search?.trim()) {
      const value = params.search.trim();
      where.OR = [
        { nombre: { contains: value, mode: 'insensitive' } },
        { email: { contains: value, mode: 'insensitive' } },
        { telefono: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.candidatos.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          score: true,
          postulaciones: {
            select: {
              id: true,
              estado: true,
              vacanteId: true,
              createdAt: true,
              vacante: {
                select: {
                  id: true,
                  cargo: { select: { nombre: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
      }),
      this.prisma.candidatos.count({ where }),
    ]);

    return {
      data: items.map((item) => this.present(item)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findDetailById(id: string, user: any) {
    const candidato = await this.prisma.candidatos.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, slug: true, name: true } },
        score: true,
        postulaciones: {
          include: {
            vacante: {
              select: {
                id: true,
                estado: true,
                tenant: { select: { name: true, slug: true } },
                cargo: { select: { nombre: true } },
              },
            },
            entrevistas: {
              select: {
                id: true,
                tipo: true,
                inicioTs: true,
                finTs: true,
                canal: true,
                resultado: true,
              },
              take: 3,
              orderBy: { inicioTs: 'desc' },
            },
            feedbacks: {
              select: {
                id: true,
                puntaje: true,
                comentario: true,
                recomendacion: true,
                ts: true,
              },
              take: 3,
              orderBy: { ts: 'desc' },
            },
            eventos: {
              select: {
                id: true,
                estadoFrom: true,
                estadoTo: true,
                motivo: true,
                ts: true,
              },
              take: 5,
              orderBy: { ts: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidato || candidato.deletedAt) throw new NotFoundException('Candidato no encontrado');

    if (!user?.isSuperAdmin) {
      const candidateTenant = (candidato as any)?.tenant?.slug;
      if (!candidateTenant || candidateTenant !== user?.tenant) {
        throw new ForbiddenException('No tienes acceso a este candidato');
      }
    }

    return this.present(candidato);
  }
}
