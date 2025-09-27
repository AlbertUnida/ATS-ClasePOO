import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { RolesPermisosModule } from '../roles-permisos/roles-permisos.module';
import { TenantsController } from './tenants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, RolesPermisosModule], // Asegúrate de importar PrismaModule
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
