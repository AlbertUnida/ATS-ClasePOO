// src/auth/dto/create-tenant-user.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateTenantUserDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional() @IsString() @IsNotEmpty()
  tenantSlug?: string;

  // Usa UNO de los dos:
  @ValidateIf(o => !o.roleName) @IsOptional() @IsString() @IsNotEmpty()
  roleId?: string;

  @ValidateIf(o => !o.roleId) @IsOptional() @IsString() @IsNotEmpty()
  roleName?: string; // p.ej. ADMIN_EMPRESA / RECLUTADOR
}
