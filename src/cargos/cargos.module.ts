import { Module } from '@nestjs/common';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule
  controllers: [CargosController],
  providers: [CargosService],
})
export class CargosModule {}
