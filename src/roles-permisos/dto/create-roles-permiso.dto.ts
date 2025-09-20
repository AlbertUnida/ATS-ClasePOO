import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRolesPermisoDto {
    @IsString() @IsNotEmpty()
    tenantSlug: string;

    @IsString()
    name: string;

    @IsOptional() @IsArray() permissionCodes?: string[]; // recomendado
    @IsOptional() @IsArray() permissionIds?: string[];   // opcional
}
