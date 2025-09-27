// src/postulaciones/dto/create-postulacion.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePostulacionDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  tenantSlug: string;

  @ApiProperty({ description: 'ID de la vacante a la que se postula' })
  @IsString() @IsNotEmpty()
  vacanteId: string;

  @ApiPropertyOptional({ description: 'Fuente de la postulación (portal, referido, etc.)' })
  @IsOptional() @IsString()
  fuente?: string;

  @ApiPropertyOptional({ description: 'Mensaje opcional del candidato (carta de presentación)' })
  @IsOptional() @IsString()
  mensaje?: string;

  @ApiPropertyOptional({ description: 'URL opcional de un CV personalizado' })
  @IsOptional() @IsString()
  cvExtraUrl?: string;
}
