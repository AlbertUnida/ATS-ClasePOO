import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRolesPermisoDto {
    @IsString() @IsNotEmpty()
    tenantSlug: string;

    @IsString()
    name: string;

    @IsOptional() @IsArray() permissionCodes?: string[]; // recomendado
    @IsOptional() @IsArray() permissionIds?: string[];   // opcional

    // OPCIONAL para escenarios más complejos
    @IsOptional() @IsArray()
    permissions?: {
        id: string;
        allowed?: boolean; // por si querés negar permisos explícitamente
    }[];
}
