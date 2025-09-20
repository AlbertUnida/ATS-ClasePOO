import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        // Usa offset si no cargaste tablas de zonas horarias
        await this.$executeRawUnsafe(`SET time_zone = '-04:00'`);
        // Si cargaste tz tables, mejor con nombre:
        // await this.$executeRawUnsafe(`SET time_zone = 'America/Asuncion'`);
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
