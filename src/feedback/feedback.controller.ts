import {
  Controller, Post, Body, Get, Query, Param, Patch, Req, NotFoundException,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
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

@ApiTags('feedbacks')
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Crear feedback para una postulación' })
  @ApiBody({ type: CreateFeedbackDto })
  @ApiResponse({ status: 201, description: 'Feedback creado correctamente' })
  @ApiResponse({ status: 404, description: 'Tenant o postulación no encontrada' })
  async create(@Body() dto: CreateFeedbackDto, @Req() req: CustomRequest) {
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

    return this.feedbackService.create(dto, userContext);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Listar feedbacks por tenant' })
  @ApiQuery({ name: 'tenant', required: true, description: 'Slug del tenant' })
  @ApiQuery({ name: 'postulacionId', required: false })
  @ApiQuery({ name: 'evaluadorUserId', required: false })
  async findAll(
    @Query('tenant') tenant: string,
    @Query('postulacionId') postulacionId?: string,
    @Query('evaluadorUserId') evaluadorUserId?: string,
  ) {
    return this.feedbackService.findAllByTenant(tenant, {
      postulacionId,
      evaluadorUserId,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Obtener feedback por ID' })
  @ApiResponse({ status: 200, description: 'Feedback encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Feedback no encontrado' })
  async findOne(@Param('id') id: string, @Req() req: CustomRequest) {
    const user = req.user;
    return this.feedbackService.findOne(id, user?.tenantId, user?.isSuperAdmin);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
  @ApiOperation({ summary: 'Actualizar un feedback (solo evaluador o superadmin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFeedbackDto>,
    @Req() req: CustomRequest,
  ) {
    const user = req.user;
    if (!user?.id) {
      throw new NotFoundException('Usuario no autenticado correctamente');
    }

    return this.feedbackService.update(id, dto, {
      id: user.id,
      isSuperAdmin: user.isSuperAdmin,
      tenantId: user.tenantId,
      roles: user.roles, // 👈 esto es necesario
    });
  }
}
