import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAutomationRuleDto {
  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  trigger!: string;

  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsOptional()
  conditionsJson?: Record<string, unknown>;

  @IsOptional()
  actionConfigJson?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
