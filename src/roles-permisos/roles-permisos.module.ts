import { Module } from '@nestjs/common';
import { RolesPermisosService } from './roles-permisos.service';
import { RolesPermisosController } from './roles-permisos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule
  controllers: [RolesPermisosController],
  providers: [RolesPermisosService],
})
export class RolesPermisosModule { }
