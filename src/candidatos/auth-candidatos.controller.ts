import { Body, Controller, Post, Get, Req, Res, Put, Ip, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { CandidatosService } from './candidatos.service';
import { AuthService } from '../auth/auth.service';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { CreatePostulacionDto } from '../postulaciones/dto/create-postulacione.dto';
import { COOKIE_SECURE, COOKIE_DOMAIN, JWT_REFRESH_SECRET, REFRESH_TOKEN_TTL, ACCESS_TOKEN_TTL } from '../auth/auth.constants';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('auth - candidatos')
@Controller('auth/candidatos')
export class AuthCandidatosController {
    constructor(private readonly candidatosService: CandidatosService,
        private readonly authService: AuthService
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Registro público de candidatos' })
    @ApiResponse({ status: 201, description: 'Registro exitoso' })
    @ApiResponse({ status: 409, description: 'Email ya registrado' })
    register(@Body() dto: CandidateRegisterDto) {
        return this.candidatosService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login de candidato' })
    @ApiResponse({ status: 200, description: 'Login exitoso, token por cookie' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    login(@Body() dto: CandidateLoginDto, @Res({ passthrough: true }) res: Response) {
        return this.candidatosService.login(dto, res);
    }

    @Get('me')
    @ApiOperation({ summary: 'Obtener perfil del candidato autenticado' })
    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')  // opcional, útil para Swagger
    getProfile(@Req() req) {
         console.log('REQ USER SUB:', req.user.sub);
        return this.candidatosService.findByCuentaId(req.user.sub);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')
    @Put('me') // 🔲 Nuevo: editar perfil
    updateProfile(@Req() req, @Body() dto: UpdateCandidatoDto) {
        return this.candidatosService.updateByCuentaId(req.user.sub, dto);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiCookieAuth('access-token')
    @Post('postular') // 🔲 Nuevo: postularse a vacante
    postular(
        @Req() req,
        @Body() dto: CreatePostulacionDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
        @Headers('referer') referer: string,
    ) {
        const userContext = {
            userId: undefined,
            accountId: req.user.sub,
            email: req.user.email,
            ip,
            userAgent,
            path: referer,
        };

        return this.candidatosService.postularDesdeCandidatoCuenta(req.user.sub, dto, userContext);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión y limpiar cookie' })
    @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access-token', {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: COOKIE_SECURE ? 'none' : 'lax',
            domain: COOKIE_DOMAIN,   // en dev, suele ser undefined
            path: '/',               // debe coincidir con el set
        });
        return { message: 'Cierre de sesión exitoso' };
    }

}
