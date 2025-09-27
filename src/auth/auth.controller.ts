import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BootstrapSuperadminDto } from './dto/bootstrap-superadmin.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { SuperAdminGuard, TenantAdminGuard } from '../common/guards/superadmin.guard';
import { COOKIE_SECURE, COOKIE_DOMAIN, JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL } from './auth.constants';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiSecurity, ApiCookieAuth } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private jwt: JwtService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso. Devuelve access token y datos del usuario' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const slug = dto.tenantSlug?.trim().toLowerCase();

    const u = await this.auth.validateLogin(dto.email, dto.password, slug);

    const access = this.auth.signAccess(u.payload);
    //const refresh = this.auth.signRefresh({ sub: u.payload.sub, tid: u.payload.tid });

    res.cookie('access_token', access, {
      ...this.auth.cookieOpts(this.auth.ttlToMs(ACCESS_TOKEN_TTL)),
      path: '/',                       // 👈 clave
    });
    //res.cookie(REFRESH_COOKIE, refresh, this.auth.cookieOpts(this.auth.ttlToMs(REFRESH_TOKEN_TTL)));

    return { access_token: access, message: 'Login exitoso' };
    // return {
    //   access_token: access,
    //   user: {
    //     id: u.payload.sub,
    //     email: u.user.email,
    //     roles: u.payload.roles,
    //     tenant: u.tenant.slug,
    //   },
    // };
  }

  @Post('bootstrap-superadmin')
  @ApiOperation({ summary: 'Bootstrap para crear superadmin (usado una sola vez)' })
  @ApiBody({ type: BootstrapSuperadminDto })
  @ApiResponse({ status: 201, description: 'Superadmin creado correctamente' })
  @ApiResponse({ status: 403, description: 'Bootstrap deshabilitado o token inválido' })
  async bootstrapSuperadmin(
    @Body() dto: BootstrapSuperadminDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('BOOTSTRAP HIT');
    console.log('HDR', req.header?.('X-Bootstrap-Token'));
    console.log('ENV', process.env.BOOTSTRAP_TOKEN, 'ALLOW', process.env.ALLOW_BOOTSTRAP);
    console.log('DTO', dto);
    if (process.env.ALLOW_BOOTSTRAP !== 'true') {
      throw new ForbiddenException('Bootstrap deshabilitado');
    }
    // const token = req.header('X-Bootstrap-Token');
    // if (!token || token !== process.env.BOOTSTRAP_TOKEN) {
    //   throw new ForbiddenException('Token inválido');
    // }

    const u = await this.auth.bootstrapCreateSuperadmin(dto);
    const access = this.auth.signAccess(u.payload);
    res.cookie('access_token', access, {
      ...this.auth.cookieOpts(this.auth.ttlToMs(ACCESS_TOKEN_TTL)),
      path: '/', // 👈 importante para que la cookie viaje a todas las rutas
    });
    //const refresh = this.auth.signRefresh({ sub: u.payload.sub, tid: u.payload.tid });

    //res.cookie(REFRESH_COOKIE, refresh, this.auth.cookieOpts(this.auth.ttlToMs(REFRESH_TOKEN_TTL)));
    //return { access_token: access, user: { id: u.payload.sub, email: u.user.email, roles: u.payload.roles, tenant: u.tenant.slug } };
    return { message: 'Superadmin creado', access_token: access };
  }

  @Post('admin/superadmins')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear o promocionar un nuevo superadmin' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string' }
      },
      required: ['name', 'email']
    }
  })
  @ApiResponse({ status: 201, description: 'Superadmin creado/promocionado' })
  async createAnotherSuperadmin(@Body() dto: { name: string; email: string; password?: string }) {
    const user = await this.auth.adminCreateOrPromoteSuperadmin(dto);
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } };
  }

  @Post('users')
  @UseGuards(AuthGuard('jwt'), SuperAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear un usuario para un tenant (SUPERADMIN)' })
  @ApiBody({ type: CreateTenantUserDto })
  @ApiResponse({ status: 201, description: 'Usuario creado para tenant' })
  async createTenantUser(@Body() dto: CreateTenantUserDto) {
    return this.auth.createTenantUser(dto);
  }

  @Post('tenant/users')
  @UseGuards(AuthGuard('jwt'), TenantAdminGuard)
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Crear usuario en tenant (ADMIN)' })
  async createUserInMyTenant(@Body() dto: CreateTenantUserDto, @Req() req: any) {
    // Ignorá cualquier tenantSlug que venga en el body
    const { tenantSlug, ...rest } = dto;
    return this.auth.createTenantUser({ ...rest, tenantSlug: req.user.tenant });
  }

  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Refrescar access token usando refresh token (cookie)' })
  // @ApiResponse({ status: 200, description: 'Nuevo access token generado' })
  // @ApiResponse({ status: 401, description: 'Refresh token inválido o ausente' })
  // async refresh(@Req() req: any) {
  //   const token = req.cookies?.[REFRESH_COOKIE];
  //   if (!token) throw new UnauthorizedException('No refresh token');

  //   let decoded: any;
  //   try { decoded = this.jwt.verify(token, { secret: JWT_REFRESH_SECRET }); }
  //   catch { throw new UnauthorizedException('Refresh inválido'); }

  //   // Revalida usuario
  //   const user = await this.auth['prisma'].usuarios.findUnique({ where: { id: decoded.sub } });
  //   if (!user || user.tenantId !== decoded.tid) throw new UnauthorizedException('Usuario/tenant inválido');

  //   // Carga datos mínimos para el access (roles/perms si ya tenés RBAC completo)
  //   const roles = await this.auth['prisma'].usuarioRoles.findMany({
  //     where: { userId: user.id }, include: { role: true },
  //   }).then(rs => rs.map(r => r.role.name));
  //   const tenant = await this.auth['prisma'].tenants.findUnique({ where: { id: decoded.tid } });
  //   const isSuperAdmin = roles.includes('SUPERADMIN') && tenant?.slug === 'root';

  //   const access = this.auth.signAccess({ sub: user.id, tid: decoded.tid, roles, perms: isSuperAdmin ? ['*'] : [], isSuperAdmin });
  //   return { access_token: access };
  // }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión y limpiar cookie' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SECURE ? 'none' : 'lax',
      domain: COOKIE_DOMAIN,   // en dev, suele ser undefined
      path: '/',               // debe coincidir con el set
    });
    return { message: 'Cierre de sesión exitoso' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  me(@Req() req: any) {

    // req.user viene del payload del access token
    // payload: { sub, tid, roles, perms, isSuperAdmin, email, tenant, iat, exp }
    return {
      id: req.user.sub,
      tenantId: req.user.tid,
      roles: req.user.roles,
      perms: req.user.perms,
      isSuperAdmin: req.user.isSuperAdmin,
      email: req.user.email,
      tenant: req.user.tenant,
    };


  }
}
