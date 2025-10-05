// src/cargos/dto/create-cargo.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCargoDto {
    // @ApiProperty() @IsString() @IsNotEmpty()
    // @Transform(({ value }) => value?.toString().trim().toLowerCase())
    // tenantSlug: string;

    @ApiProperty() @IsString() @IsNotEmpty()
    @Transform(({ value }) => value?.toString().trim())
    nombre: string;

    @ApiPropertyOptional({ description: 'Objeto libre con competencias' })
    @IsOptional() @IsObject()
    competencias?: Record<string, any>;
}
