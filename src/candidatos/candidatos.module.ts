import { Module } from '@nestjs/common';
import { CandidatosService } from './candidatos.service';
import { CandidatosController } from './candidatos.controller';
import { AuthCandidatosController } from './auth-candidatos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule], // Asegúrate de importar PrismaModule
  controllers: [CandidatosController, AuthCandidatosController],
  providers: [CandidatosService],
})
export class CandidatosModule {}
