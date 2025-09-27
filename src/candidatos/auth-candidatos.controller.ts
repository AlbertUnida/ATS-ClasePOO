import { Body, Controller, Post, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { CandidatosService } from './candidatos.service';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('Auth - Candidatos')
@Controller('auth/candidatos')
export class AuthCandidatosController {
    constructor(private readonly candidatosService: CandidatosService) { }

    @Post('register')
    @ApiOperation({ summary: 'Registro público de candidatos' })
    @ApiResponse({ status: 201, description: 'Registro exitoso' })
    @ApiResponse({ status: 409, description: 'Email ya registrado' })
    register(@Body() dto: CandidateRegisterDto) {
        return this.candidatosService.register(dto);
    }

    @Post('login')
    @ApiOperation({ summary: 'Login de candidato' })
    @ApiResponse({ status: 201, description: 'Login exitoso, token por cookie' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
    login(@Body() dto: CandidateLoginDto, @Res({ passthrough: true }) res: Response) {
        return this.candidatosService.login(dto, res);
    }

    @UseGuards(AuthGuard('jwt')) // Usás tu estrategia JWT de Nest
    @ApiCookieAuth('access-token') // Swagger muestra que se usa la cookie
    @Get('me')
    @ApiOperation({ summary: 'Obtener perfil del candidato autenticado' })
    getProfile(@Req() req) {
        // req.user fue extraído del token por la estrategia JWT
        return this.candidatosService.findByCuentaId(req.user.sub);
    }
}
