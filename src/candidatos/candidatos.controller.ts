import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CandidatosService } from './candidatos.service';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { AdminOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { AuthGuard } from '@nestjs/passport';
import { ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('candidatos')
@Controller('candidatos')
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear candidato desde backend (uso interno)' })
  @ApiBody({
    type: CreateCandidatoDto,
    examples: {
      soloCandidato: {
        summary: 'Solo registra candidato',
        value: {
          tenantSlug: 'tecnoedil',
          nombre: 'María López',
          email: 'maria@example.com',
          telefono: '0981-111-222',
          cvUrl: 'https://cdn/cv.pdf',
          perfil: { skills: ['Node', 'React'] }
        }
      },
      candidatoConUsuario: {
        summary: 'Registra candidato y crea usuario (rol CANDIDATO)',
        value: {
          tenantSlug: 'tecnoedil',
          nombre: 'María López',
          email: 'maria@example.com',
          createUser: true,
          password: 'Secr3ta123',
          perfil: { linkedin: 'https://linkedin.com/in/maria' }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Candidato creado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya existe en este tenant' })
  create(@Body() dto: CreateCandidatoDto) {
    return this.candidatosService.create(dto);
  }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Actualizar perfil de candidato' })
  // @ApiParam({ name: 'id', description: 'ID del candidato' })
  // @ApiBody({ type: UpdateCandidatoDto })
  // @ApiResponse({ status: 200, description: 'Candidato actualizado' })
  // @ApiResponse({ status: 404, description: 'Candidato no encontrado' })
  // @ApiResponse({ status: 409, description: 'Email ya está en uso en este tenant' })
  // update(@Param('id') id: string, @Body() dto: UpdateCandidatoDto) {
  //   return this.candidatosService.update(id, dto);
  // }

}
