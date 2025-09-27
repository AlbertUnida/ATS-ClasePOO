import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class CandidatoGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            throw new ForbiddenException('No autenticado');
        }

        // Asegurar que sea candidato (no admin ni superadmin ni reclutador)
        const roles = user.roles || [];

        const isSuperAdmin = user?.isSuperAdmin === true;
        const isAdminOrReclutador = Array.isArray(roles) &&
            (roles.includes('ADMIN') || roles.includes('RECLUTADOR'));

        if (isSuperAdmin || isAdminOrReclutador) {
            throw new ForbiddenException('Solo candidatos pueden acceder a este recurso');
        }

        // Si pasa todos los filtros, se asume que es un candidato
        return true;
    }
}