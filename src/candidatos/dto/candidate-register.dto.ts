// dto/candidate-register.dto.ts
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CandidateRegisterDto {
    @IsString() name!: string;

    @IsEmail()
    @Transform(({ value }) => value?.toString().trim().toLowerCase())
    email!: string;

    @IsString() @MinLength(8)
    password!: string;

    @IsOptional() @IsString()
    telefono?: string;

    @IsOptional() @IsString()
    cvUrl?: string; // deja validación estricta para más adelante si querés
}
