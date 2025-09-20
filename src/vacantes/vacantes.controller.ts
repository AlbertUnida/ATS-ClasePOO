import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('vacantes')
@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantes: VacantesService) { }

  @Post()
  @ApiOperation({ summary: 'Crear vacante (requiere cargoId ya existente)' })
  @ApiBody({ type: CreateVacanteDto })
  @ApiResponse({ status: 201, description: 'Vacante creada' })
  create(@Body() dto: CreateVacanteDto) {
    return this.vacantes.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vacantes por tenant (opcional estado)' })
  @ApiQuery({ name: 'tenant', required: true })
  @ApiQuery({ name: 'estado', required: false, enum: ['abierta', 'pausada', 'cerrada'] })
  list(@Query('tenant') tenant: string, @Query('estado') estado?: string) {
    return this.vacantes.list(tenant, estado);
  }
  
}
