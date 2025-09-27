// src/postulaciones/postulaciones.controller.ts
import { PostulacionesService } from './postulaciones.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';
import { Request } from 'express';
import { Controller, Post, Body, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CandidatoGuard } from '../common/guards/candidato.guard';


interface CustomRequest extends Request {
  user?: {
    id?: string;
    accountId?: string;
    email?: string;
    isSuperAdmin?: boolean;
    roles?: string[];
  };
}
 
@ApiTags('postulaciones')
@Controller('postulaciones')
export class PostulacionesController {
  constructor(private readonly postulaciones: PostulacionesService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), CandidatoGuard) // Solo candidatos autenticados pueden postularse
  @ApiOperation({ summary: 'Crear postulación (vacante + candidato)' })
  @ApiBody({ type: CreatePostulacionDto })
  @ApiResponse({ status: 201, description: 'Postulación creada' })
  @ApiResponse({ status: 404, description: 'Tenant/Vacante/Candidato no encontrado' })
  @ApiResponse({ status: 409, description: 'El candidato ya está postulado a esa vacante' })
  async create(
    @Body() dto: CreatePostulacionDto,
    @Req() req: CustomRequest
  ) {
    const user = req.user;

    if (!user?.id) {
      throw new BadRequestException('Usuario no autenticado correctamente');
    }

    const userContext = {
      userId: user.id,
      accountId: user.accountId,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
    };

    return this.postulaciones.create(dto, user.id, userContext);
  }

  @Get()
  @UseGuards(AuthGuard('jwt')) // Si querés que solo usuarios autenticados puedan ver postulaciones
  @ApiOperation({ summary: 'Listar postulaciones por tenant (filtros opcionales)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  @ApiQuery({ name: 'vacanteId', required: false })
  @ApiQuery({ name: 'candidatoId', required: false })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['postulado', 'en_proceso', 'descartado', 'contratado'],
  })
  async list(
    @Query('tenant') tenant: string,
    @Query('vacanteId') vacanteId?: string,
    @Query('candidatoId') candidatoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.postulaciones.list(tenant, {
      vacanteId,
      candidatoId,
      estado,
    });
  }
}