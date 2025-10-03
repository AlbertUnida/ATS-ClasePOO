import { Controller, Get, Post, Body, Patch, Param, Query, Delete, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { EntrevistasService } from './entrevistas.service';
import { CreateEntrevistaDto } from './dto/create-entrevista.dto';
import { UpdateEntrevistaDto } from './dto/update-entrevista.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';

interface CustomRequest extends Request {
  user?: {
    id?: string;
    accountId?: string;
    email?: string;
    isSuperAdmin?: boolean;
    tenantId?: string;
    roles?: string[];
  };
}

@ApiTags('entrevistas')
@Controller('entrevistas')
export class EntrevistasController {
  constructor(private readonly entrevistasService: EntrevistasService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Crear una entrevista para una postulación' })
  @ApiBody({ type: CreateEntrevistaDto })
  @ApiResponse({ status: 201, description: 'Entrevista creada correctamente' })
  @ApiResponse({ status: 404, description: 'Tenant o postulación no encontrada' })
  async create(@Body() dto: CreateEntrevistaDto, @Req() req: CustomRequest) {
    const user = req.user;
    if (!user?.id) {
      throw new NotFoundException('Usuario no autenticado correctamente');
    }

    const userContext = {
      userId: user.id,
      accountId: user.accountId,
      email: user.email,
      ip: (req as any).ip,
      userAgent: req.headers['user-agent'],
      path: (req as any).originalUrl,
    };

    return this.entrevistasService.create(dto, userContext);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Listar entrevistas por tenant' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  @ApiQuery({ name: 'postulacionId', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'resultado', required: false })
  async findAll(
    @Query('tenant') tenant: string,
    @Query('postulacionId') postulacionId?: string,
    @Query('tipo') tipo?: string,
    @Query('resultado') resultado?: string,
  ) {
    return this.entrevistasService.findAllByTenant(tenant, {
      postulacionId,
      tipo,
      resultado,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Obtener entrevista por ID' })
  @ApiResponse({ status: 200, description: 'Entrevista encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Entrevista no encontrada' })
  async findOne(@Param('id') id: string, @Req() req: CustomRequest) {
    const user = req.user;
    return this.entrevistasService.findOne(id, user?.tenantId, user?.isSuperAdmin);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar una entrevista' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEntrevistaDto>,
  ) {
    return this.entrevistasService.update(id, dto);
  }

  // ⚠️ Opcional: sólo si querés permitir eliminar entrevistas
  // @Delete(':id')
  // @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  // @ApiOperation({ summary: 'Eliminar entrevista (solo SuperAdmin)' })
  // async remove(@Param('id') id: string) {
  //   return this.entrevistasService.remove(id);
  // }
}
