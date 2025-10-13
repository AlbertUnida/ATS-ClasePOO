import { IsOptional, IsString, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCandidatoDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toString().trim())
    nombre?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toString().trim())
    telefono?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toString().trim())
    cvUrl?: string;

    @IsOptional()
    @IsObject()
    perfil?: Record<string, any>;
}
