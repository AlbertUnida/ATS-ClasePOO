import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Asegúrate de importar PrismaModule
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
