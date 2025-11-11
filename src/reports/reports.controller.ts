import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminReclutadorOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'), AdminReclutadorOrSuperAdminGuard)
@ApiCookieAuth('access-token')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Resumen ejecutivo del tenant (vacantes, postulaciones, entrevistas, tiempos)' })
  @ApiQuery({ name: 'tenant', required: true })
  @ApiQuery({ name: 'from', required: false, description: 'Fecha inicial (ISO)' })
  @ApiQuery({ name: 'to', required: false, description: 'Fecha final (ISO)' })
  async getOverview(@Query('tenant') tenant: string, @Query('from') from?: string, @Query('to') to?: string) {
    if (!tenant) throw new BadRequestException('tenant es requerido');
    const range = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
    return this.reports.overview(tenant.trim().toLowerCase(), range);
  }
}
