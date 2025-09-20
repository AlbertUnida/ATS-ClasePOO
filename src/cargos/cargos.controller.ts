import { Controller, Get, Post, Body, Query, Patch, Param, Delete } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('cargos')
@Controller('cargos')
export class CargosController {
  constructor(private readonly cargos: CargosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cargo (requiere tenantSlug)' })
  @ApiBody({ type: CreateCargoDto })
  @ApiResponse({ status: 201, description: 'Cargo creado' })
  create(@Body() dto: CreateCargoDto) {
    return this.cargos.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cargos (opcional: filtrar por ?tenant=slug)' })
  @ApiQuery({ name: 'tenant', required: false, description: 'Slug del tenant para filtrar' })
  list(@Query('tenant') tenant?: string) {
    const t = tenant?.trim().toLowerCase();
    return t ? this.cargos.listByTenant(t) : this.cargos.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cargo por id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Cargo encontrado' })
  @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.cargos.findOne(id);
  }
}
