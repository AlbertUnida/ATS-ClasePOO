import { IsOptional, IsString } from 'class-validator';

export class RecalculateScoringDto {
  @IsOptional()
  @IsString()
  tenant?: string;

  @IsOptional()
  @IsString()
  candidatoId?: string;
}
