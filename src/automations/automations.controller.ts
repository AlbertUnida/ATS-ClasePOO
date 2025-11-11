import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
import { AuthGuard } from '@nestjs/passport';
import { AdminOrSuperAdminGuard } from '../common/guards/superadmin.guard';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('automations')
@Controller('automations')
@UseGuards(AuthGuard('jwt'), AdminOrSuperAdminGuard)
@ApiCookieAuth('access-token')
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  private resolveTenant(req: any, tenant?: string) {
    if (tenant) return tenant.trim().toLowerCase();
    return req.user?.tenant;
  }

  private ensureTenantAccess(req: any, tenant: string) {
    if (req.user?.isSuperAdmin) return;
    if (tenant !== req.user?.tenant) {
      throw new Error('No tienes permisos sobre este tenant');
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'Listar plantillas de correo por tenant' })
  @ApiQuery({ name: 'tenant', required: false })
  listTemplates(@Query('tenant') tenant: string, @Req() req: any) {
    const resolved = this.resolveTenant(req, tenant);
    this.ensureTenantAccess(req, resolved);
    return this.automations.listEmailTemplates(resolved);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Crear plantilla de correo' })
  createTemplate(@Body() dto: CreateEmailTemplateDto, @Req() req: any) {
    const resolved = dto.tenantSlug ?? this.resolveTenant(req, undefined);
    if (!resolved) throw new Error('tenantSlug es requerido');
    this.ensureTenantAccess(req, resolved);
    return this.automations.createEmailTemplate({ ...dto, tenantSlug: resolved });
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Actualizar plantilla' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto, @Req() req: any) {
    if (dto.tenantSlug) {
      this.ensureTenantAccess(req, dto.tenantSlug);
    } else if (!req.user?.isSuperAdmin) {
      dto.tenantSlug = req.user?.tenant;
    }
    return this.automations.updateEmailTemplate(id, dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Listar reglas de automatización por tenant' })
  @ApiQuery({ name: 'tenant', required: false })
  listRules(@Query('tenant') tenant: string, @Req() req: any) {
    const resolved = this.resolveTenant(req, tenant);
    this.ensureTenantAccess(req, resolved);
    return this.automations.listRules(resolved);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Crear una regla de automatización' })
  createRule(@Body() dto: CreateAutomationRuleDto, @Req() req: any) {
    const resolved = dto.tenantSlug ?? this.resolveTenant(req, undefined);
    if (!resolved) throw new Error('tenantSlug es requerido');
    this.ensureTenantAccess(req, resolved);
    return this.automations.createRule({ ...dto, tenantSlug: resolved });
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Actualizar regla de automatización' })
  updateRule(@Param('id') id: string, @Body() dto: UpdateAutomationRuleDto, @Req() req: any) {
    if (dto.tenantSlug) {
      this.ensureTenantAccess(req, dto.tenantSlug);
    } else if (!req.user?.isSuperAdmin) {
      dto.tenantSlug = req.user?.tenant;
    }
    return this.automations.updateRule(id, dto);
  }
}
