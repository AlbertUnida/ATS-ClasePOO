import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { EmailTemplates } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateAutomationRuleDto } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';

type AutomationContext = {
  postulacion?: any;
  candidato?: any;
  vacante?: any;
};

@Injectable()
export class AutomationsService {
  constructor(private prisma: PrismaService) {}

  private toJsonInput(value?: Record<string, unknown> | null) {
    if (value === undefined) return undefined;
    if (value === null) return Prisma.JsonNull;
    return value as Prisma.InputJsonValue;
  }

  private async resolveTenantId(slug: string) {
    const tenant = await this.prisma.tenants.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant.id;
  }

  async listEmailTemplates(tenantSlug: string) {
    return this.prisma.emailTemplates.findMany({
      where: { tenant: { slug: tenantSlug } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createEmailTemplate(dto: CreateEmailTemplateDto) {
    const tenantId = await this.resolveTenantId(dto.tenantSlug);
    return this.prisma.emailTemplates.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code.trim().toLowerCase(),
        subject: dto.subject,
        body: dto.body,
        channel: dto.channel ?? 'email',
        active: dto.active ?? true,
      },
    });
  }

  async updateEmailTemplate(id: string, dto: UpdateEmailTemplateDto) {
    const template = await this.prisma.emailTemplates.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');

    const data: any = { ...dto };
    if (dto.tenantSlug) {
      data.tenantId = await this.resolveTenantId(dto.tenantSlug);
    }
    if (dto.code) data.code = dto.code.trim().toLowerCase();

    delete data.tenantSlug;

    return this.prisma.emailTemplates.update({
      where: { id },
      data,
    });
  }

  async listRules(tenantSlug: string) {
    return this.prisma.automationRules.findMany({
      where: { tenant: { slug: tenantSlug } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(dto: CreateAutomationRuleDto) {
    const tenantId = await this.resolveTenantId(dto.tenantSlug);
    return this.prisma.automationRules.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger,
        action: dto.action,
        conditionsJson: this.toJsonInput(dto.conditionsJson),
        actionConfigJson: this.toJsonInput(dto.actionConfigJson),
        active: dto.active ?? true,
      },
    });
  }

  async updateRule(id: string, dto: UpdateAutomationRuleDto) {
    const rule = await this.prisma.automationRules.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regla no encontrada');
    const data: any = { ...dto };
    if (dto.tenantSlug) {
      data.tenantId = await this.resolveTenantId(dto.tenantSlug);
    }
    delete data.tenantSlug;
    if ('conditionsJson' in dto) {
      data.conditionsJson = this.toJsonInput(dto.conditionsJson);
    }
    if ('actionConfigJson' in dto) {
      data.actionConfigJson = this.toJsonInput(dto.actionConfigJson);
    }
    return this.prisma.automationRules.update({
      where: { id },
      data,
    });
  }

  async executeTrigger(tenantId: string, trigger: string, context: AutomationContext) {
    const rules = await this.prisma.automationRules.findMany({
      where: { tenantId, trigger, active: true },
    });
    if (!rules.length) return;

    for (const rule of rules) {
      if (!this.matchesConditions(rule.conditionsJson, context)) continue;
      if (rule.action === 'send_email_template') {
        await this.handleSendEmail(rule, tenantId, context).catch(() => undefined);
      }
    }
  }

  private matchesConditions(conditions: any, context: AutomationContext) {
    if (!conditions) return true;
    if (conditions.estado && context.postulacion?.estado) {
      if (context.postulacion.estado !== conditions.estado) return false;
    }
    if (conditions.visibilidad && context.vacante?.visibilidad) {
      if (context.vacante.visibilidad !== conditions.visibilidad) return false;
    }
    return true;
  }

  private async handleSendEmail(rule: any, tenantId: string, context: AutomationContext) {
    const config = rule.actionConfigJson ?? {};
    let template: EmailTemplates | null = null;
    if (config.templateId) {
      template = await this.prisma.emailTemplates.findUnique({
        where: { id: config.templateId as string },
      });
    } else if (config.templateCode) {
      template = await this.prisma.emailTemplates.findFirst({
        where: { tenantId, code: String(config.templateCode) },
      });
    }
    if (!template || !template.active) return;

    const candidateEmail = context.candidato?.email ?? context.postulacion?.candidato?.email;
    if (!candidateEmail) return;

    const subject = this.interpolate(template.subject, context);
    const body = this.interpolate(template.body, context);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorEmail: 'automation@system',
        action: 'AUTOMATION',
        entity: 'Email',
        entityId: template.id,
        note: `Envio automatizado "${rule.name}" hacia ${candidateEmail}`,
        path: `trigger:${rule.trigger}`,
      },
    });

    console.info('[Automation] Email simulado', {
      to: candidateEmail,
      subject,
      body,
    });
  }

  private interpolate(text: string, context: AutomationContext) {
    if (!text) return text;
    return text
      .replace(/{{candidato\.nombre}}/gi, context.candidato?.nombre ?? 'Candidato')
      .replace(/{{vacante\.cargo}}/gi, context.vacante?.cargo?.nombre ?? 'Vacante')
      .replace(/{{postulacion\.estado}}/gi, context.postulacion?.estado ?? 'estado')
      .replace(/{{tenant}}/gi, context.vacante?.tenant?.name ?? '');
  }
}
