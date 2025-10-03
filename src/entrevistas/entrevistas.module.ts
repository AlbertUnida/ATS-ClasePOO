import { Module } from '@nestjs/common';
import { EntrevistasService } from './entrevistas.service';
import { EntrevistasController } from './entrevistas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntrevistasController],
  providers: [EntrevistasService],
})
export class EntrevistasModule { }
