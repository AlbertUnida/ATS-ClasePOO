import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.get<string[]>('perms', ctx.getHandler()) ?? [];
        if (!required.length) return true;

        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if (user?.isSuperAdmin) return true; // superadmin bypass
        const userPerms: string[] = user?.perms ?? []; // del JWT

        return required.every(p => userPerms.includes(p));
    }
}
