// src/postulaciones/dto/create-postulacion.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePostulacionDto {
    @ApiProperty() @IsString() @IsNotEmpty()
    @Transform(({ value }) => value?.toString().trim().toLowerCase())
    tenantSlug: string;

    @ApiProperty() @IsString() @IsNotEmpty()
    vacanteId: string;

    @ApiProperty() @IsString() @IsNotEmpty()
    candidatoId: string;

    @ApiPropertyOptional({ description: 'Fuente de la postulación (portal, referido, etc.)' })
    @IsOptional() @IsString()
    fuente?: string;
}
