import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        if (!user) throw new ForbiddenException('No autenticado');

        // superadmin puede operar cross-tenant
        if (user.isSuperAdmin) return true;

        if (!req.tenant?.id) throw new ForbiddenException('Tenant requerido');
        if (user.tid !== req.tenant.id) throw new ForbiddenException('Tenant inválido');

        return true;
    }
}
