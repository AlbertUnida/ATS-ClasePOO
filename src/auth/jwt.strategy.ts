// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../auth/auth.constants';

function fromAccessCookie(req: any): string | null {
  return req?.cookies?.['access_token'] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      secretOrKey: JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromAccessCookie,                            // 👈 cookie primero
        ExtractJwt.fromAuthHeaderAsBearerToken(),    // 👈 header después (opcional)
      ]),
      ignoreExpiration: false,
    });
  }
  validate(payload: any) { return payload; }
}
