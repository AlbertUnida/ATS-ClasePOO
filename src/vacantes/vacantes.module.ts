import { Module } from '@nestjs/common';
import { VacantesService } from './vacantes.service';
import { VacantesController } from './vacantes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule
  controllers: [VacantesController],
  providers: [VacantesService],
})
export class VacantesModule {}
