// src/postulaciones/postulaciones.controller.ts
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { CreatePostulacionDto } from './dto/create-postulacione.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('postulaciones')
@Controller('postulaciones')
export class PostulacionesController {
  constructor(private readonly postulaciones: PostulacionesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear postulación (vacante + candidato)' })
  @ApiBody({ type: CreatePostulacionDto })
  @ApiResponse({ status: 201, description: 'Postulación creada' })
  @ApiResponse({ status: 404, description: 'Tenant/Vacante/Candidato no encontrado' })
  @ApiResponse({ status: 409, description: 'El candidato ya está postulado a esa vacante' })
  create(@Body() dto: CreatePostulacionDto) {
    return this.postulaciones.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar postulaciones por tenant (filtros opcionales)' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  @ApiQuery({ name: 'vacanteId', required: false })
  @ApiQuery({ name: 'candidatoId', required: false })
  // Si agregaste filtro de estado en el service, expónlo también:
  @ApiQuery({ name: 'estado', required: false, enum: ['CREADA', 'EN_PROCESO', 'FINALIZADA', 'DESCARTADA'] })
  list(
    @Query('tenant') tenant: string,
    @Query('vacanteId') vacanteId?: string,
    @Query('candidatoId') candidatoId?: string,
    @Query('estado') estado?: string,
  ) {
    // si no implementaste estado, elimina el arg y la ApiQuery de arriba
    return this.postulaciones.list(tenant, vacanteId, candidatoId /* , estado */);
  }
}