import { Module } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { PostulacionesController } from './postulaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [PrismaModule, AutomationsModule],
  controllers: [PostulacionesController],
  providers: [PostulacionesService],
  exports: [PostulacionesService], // 👈 Necesario para que otros módulos lo usen
})
export class PostulacionesModule {}
