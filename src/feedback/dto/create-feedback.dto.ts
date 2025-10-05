import { IsString, IsDateString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateFeedbackDto {
    @IsString()
    tenantSlug: string;

    @IsString()
    postulacionId: string;

    @IsInt()
    puntaje: number;

    @IsOptional()
    @IsString()
    competenciasJson?: string;

    @IsOptional()
    @IsString()
    comentario?: string;

    @IsOptional()
    @IsBoolean()
    recomendacion?: boolean;
}

