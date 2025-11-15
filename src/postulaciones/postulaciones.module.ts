import { Module } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { PostulacionesController } from './postulaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationsModule } from '../automations/automations.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [PrismaModule, AutomationsModule, ScoringModule],
  controllers: [PostulacionesController],
  providers: [PostulacionesService],
  exports: [PostulacionesService],
})
export class PostulacionesModule {}
