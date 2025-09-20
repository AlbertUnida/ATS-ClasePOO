import { IsEmail, IsString, MinLength } from 'class-validator';

export class BootstrapSuperadminDto {
    @IsString() name: string;
    @IsEmail() email: string;
    @IsString() @MinLength(8) password: string;
    // opcionalmente podrías aceptar el token por body, pero prefiero cabecera
}
