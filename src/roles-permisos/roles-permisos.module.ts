import { Module } from '@nestjs/common';
import { RolesPermisosService } from './roles-permisos.service';
import { RolesPermisosController } from './roles-permisos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule
  controllers: [RolesPermisosController],
  providers: [RolesPermisosService],
  exports: [RolesPermisosService], // Exporta el servicio para usarlo en otros módulos
})
export class RolesPermisosModule { }
