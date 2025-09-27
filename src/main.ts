import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? true,
    credentials: true,
  });

  // Validación global (Swagger muestra mejor los DTO)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ATS Api')
    .setDescription('API de reclutamiento multi-tenant')
    .setVersion('0.1.0')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    })
    // Bearer JWT para endpoints protegidos
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    // Cookie refresh (si lo usas en /auth/refresh)
    //.addCookieAuth('refresh_token')
    // Header para bootstrap (opcional)
    .addApiKey({ type: 'apiKey', name: 'X-Bootstrap-Token', in: 'header' }, 'bootstrap-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4050);
}
bootstrap();
