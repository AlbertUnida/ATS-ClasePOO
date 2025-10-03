import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateEntrevistaDto {
    @IsString()
    tenantSlug: string;

    @IsString()
    postulacionId: string;

    @IsString()
    tipo: string;

    @IsDateString()
    inicioTs: string;

    @IsDateString()
    finTs: string;

    @IsOptional()
    @IsString()
    canal?: string;

    @IsOptional()
    @IsString()
    resultado?: string;

    @IsOptional()
    @IsString()
    notas?: string;
}
