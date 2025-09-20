// src/vacantes/dto/create-vacante.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer'

export class CreateVacanteDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  tenantSlug: string;

  @ApiProperty({ description: 'ID de un cargo existente' })
  @IsString() @IsNotEmpty()
  cargoId: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  ubicacion?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  tipoContrato?: string;

  @ApiPropertyOptional({ enum: ['abierta', 'pausada', 'cerrada'] })
  @IsOptional() @IsIn(['abierta', 'pausada', 'cerrada'])
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  estado?: 'abierta' | 'pausada' | 'cerrada';

  @ApiPropertyOptional({ description: 'Objeto de flujo de aprobación' })
  @IsOptional() @IsObject()
  flujoAprobacion?: Record<string, any>;
}