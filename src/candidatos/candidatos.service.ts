import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Response } from 'express';

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
      // if (dto.createUser && dto.password) {
      //   await this.authService.createTenantUser({
      //     name: dto.nombre,
      //     email: dto.email,
      //     password: dto.password,
      //     tenantSlug: dto.tenantSlug,
      //     roleName: 'CANDIDATO',
      //     candidatoId: cand.id,       // 👈 vínculo 1:1
      //   });
      // }

      return this.present(cand);
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe un candidato con ese email en este tenant');
      throw e;
    }
  }

  async register(dto: CandidateRegisterDto) {
    // 🔥 Eliminamos lógica de tenantSlug
    const exists = await this.prisma.candidatoCuentas.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe una cuenta con ese email');

    const hashedPassword = await this.authService.hashPassword(dto.password);
    const cuenta = await this.prisma.candidatoCuentas.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
      },
    });

    const candidato = await this.prisma.candidatos.create({
      data: {
        nombre: dto.name,
        email: dto.email,
        telefono: dto.telefono,
        cvUrl: dto.cvUrl,
        cuentaId: cuenta.id,
      },
    });

    return this.present(candidato);
  }

  async login(dto: CandidateLoginDto, res: Response) {
    const cuenta = await this.prisma.candidatoCuentas.findUnique({
      where: { email: dto.email },
      include: { candidatos: true }, // si querés acceder al perfil
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
      // podés incluir más info si querés
    };

    const accessToken = await this.authService.signAccess(payload);

    res.cookie('access-token', accessToken, this.authService.cookieOpts());
    //return { message: 'Login exitoso' };

    return {
      access_token: accessToken,
      message: 'Login exitoso' 
      //candidato: cuenta.candidatos[0] ?? null,
    };
  }

  async findByCuentaId(cuentaId: string) {
    const candidato = await this.prisma.candidatos.findFirst({
      where: { cuentaId },
    });

    if (!candidato) {
      throw new NotFoundException('Candidato no encontrado');
    }

    return this.present(candidato); // Usás tu método present() para ocultar perfilJson
  }


}
