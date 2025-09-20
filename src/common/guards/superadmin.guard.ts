import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const user = ctx.switchToHttp().getRequest().user;
        if (user?.isSuperAdmin) return true;
        throw new ForbiddenException('Acceso denegado: no tiene permisos para esta acción');
    }
}
