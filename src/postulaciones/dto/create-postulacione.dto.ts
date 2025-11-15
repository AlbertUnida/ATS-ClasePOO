// src/postulaciones/dto/create-postulacion.dto.ts
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const toLowerTrim = ({ value }: { value: any }) =>
  value?.toString().trim().toLowerCase() ?? value;

const toNumberOrUndefined = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toStringArray = ({ value }: { value: any }) => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => item?.toString().trim())
      .filter((item) => !!item);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => !!item);
  }
  return undefined;
};

export class CreatePostulacionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(toLowerTrim)
  tenantSlug: string;

  @ApiProperty({ description: 'ID de la vacante a la que se postula' })
  @IsString()
  @IsNotEmpty()
  vacanteId: string;

  @ApiPropertyOptional({
    description: 'Fuente de la postulaci��n (portal, referido, etc.)',
  })
  @IsOptional()
  @IsString()
  fuente?: string;

  @ApiPropertyOptional({
    description: 'Mensaje opcional del candidato (carta de presentaci��n)',
  })
  @IsOptional()
  @IsString()
  mensaje?: string;

  @ApiPropertyOptional({ description: 'URL opcional de un CV personalizado' })
  @IsOptional()
  @IsString()
  cvExtraUrl?: string;

  @ApiPropertyOptional({
    description: 'Nivel de formaci��n declarado por el candidato',
  })
  @IsOptional()
  @IsString()
  @Transform(toLowerTrim)
  formacionNivel?: string;

  @ApiPropertyOptional({ description: 'A��os de experiencia laboral' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(toNumberOrUndefined)
  anosExperiencia?: number;

  @ApiPropertyOptional({
    description: 'Listado de habilidades t��cnicas principales',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  habilidadesTecnicas?: string[];

  @ApiPropertyOptional({
    description: 'Listado de competencias blandas declaradas',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  competenciasBlandas?: string[];

  @ApiPropertyOptional({
    description: 'Palabras clave destacadas del CV/Perfil',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(toStringArray)
  palabrasClave?: string[];
}
