import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CandidatosService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) { }

  private present(c: any) {
    // Opcional: exponer "perfil" (objeto) y ocultar perfilJson
    const perfil = c.perfilJson ? JSON.parse(c.perfilJson) : undefined;
    const { perfilJson, ...rest } = c;
    return { ...rest, perfil };
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

      // 👇 crear usuario automáticamente (rol CANDIDATO) si se pidió
      if (dto.createUser && dto.password) {
        await this.authService.createTenantUser({
          name: dto.nombre,
          email: dto.email,
          password: dto.password,
          tenantSlug: dto.tenantSlug,
          roleName: 'CANDIDATO',
          candidatoId: cand.id,       // 👈 vínculo 1:1
        });
      }

      return this.present(cand);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un candidato con ese email en este tenant');
      throw e;
    }
  }

  // candidatos.service.ts
  async update(id: string, dto: UpdateCandidatoDto) {
    try {
      return await this.prisma.candidatos.update({
        where: { id },
        data: {
          nombre: dto.nombre?.trim(),
          email: dto.email?.toLowerCase(),
          telefono: dto.telefono?.trim(),
          cvUrl: dto.cvUrl,
          perfilJson: dto.perfil ? JSON.stringify(dto.perfil) : undefined,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2025') throw new NotFoundException('Candidato no encontrado');
      if (e.code === 'P2002') throw new ConflictException('Email ya está en uso en este tenant');
      throw e;
    }
  }


}
