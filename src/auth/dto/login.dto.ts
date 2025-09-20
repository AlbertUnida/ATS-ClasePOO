import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsEmail() email: string;
    @IsString() password: string;
    @IsOptional() @IsString() tenantSlug?: string; // si no llega, usamos el resuelto por middleware o "root"
}