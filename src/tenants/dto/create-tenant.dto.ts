// src/tenants/dto/create-tenant.dto.ts
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTenantDto {
    @IsString() @IsNotEmpty()
    name: string;

    // opcional, si no llega se genera a partir de name
    @IsOptional() @IsString()
    @Matches(/^[a-z0-9\-]+$/, { message: 'slug debe ser kebab-case: [a-z0-9-]' })
    slug?: string;

    // opcional, por defecto 'ACTIVE'
    @IsOptional() @IsString()
    status?: 'activo' | 'suspendido' | 'archivado';
}