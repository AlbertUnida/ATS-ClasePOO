import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCookieAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Express } from 'express';

import { CandidatosService } from './candidatos.service';
import { CandidateRegisterDto } from './dto/candidate-register.dto';
import { CandidateLoginDto } from './dto/candidate-login.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { CreatePostulacionDto } from '../postulaciones/dto/create-postulacione.dto';
import { COOKIE_DOMAIN, COOKIE_SECURE } from '../auth/auth.constants';

const CV_UPLOADS_DIR = join(process.cwd(), 'uploads', 'candidatos');
if (!existsSync(CV_UPLOADS_DIR)) {
  mkdirSync(CV_UPLOADS_DIR, { recursive: true });
}

const CV_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@ApiTags('auth - candidatos')
@Controller('auth/candidatos')
export class AuthCandidatosController {
  constructor(private readonly candidatosService: CandidatosService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registro público de candidatos' })
  @ApiResponse({ status: 201, description: 'Registro exitoso' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  register(@Body() dto: CandidateRegisterDto) {
    return this.candidatosService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de candidato' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve token' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() dto: CandidateLoginDto, @Res({ passthrough: true }) res: Response) {
    return this.candidatosService.login(dto, res);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del candidato autenticado' })
  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  getProfile(@Req() req: any) {
    return this.candidatosService.findByCuentaId(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @Put('me')
  @ApiOperation({ summary: 'Actualizar perfil del candidato' })
  updateProfile(@Req() req: any, @Body() dto: UpdateCandidatoDto) {
    return this.candidatosService.updateByCuentaId(req.user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @Get('postulaciones')
  @ApiOperation({ summary: 'Listar postulaciones del candidato autenticado' })
  getPostulaciones(@Req() req: any) {
    return this.candidatosService.findByCuentaId(req.user.sub, true);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @Post('postular')
  @ApiOperation({ summary: 'Crear postulacion como candidato' })
  postular(
    @Req() req: any,
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

  @UseGuards(AuthGuard('jwt'))
  @ApiCookieAuth('access-token')
  @Post('cv')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: CV_UPLOADS_DIR,
        filename: (_req, file, callback) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          callback(null, unique);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!CV_MIME_TYPES.has(file.mimetype.toLowerCase())) {
          return callback(new BadRequestException('Solo se permiten archivos PDF o Word'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadCv(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Archivo de CV requerido');
    const publicPath = `/uploads/candidatos/${file.filename}`;
    return this.candidatosService.updateCvFromUpload(req.user.sub, publicPath);
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
      domain: COOKIE_DOMAIN,
      path: '/',
    });
    return { message: 'Cierre de sesión exitoso' };
  }
}
