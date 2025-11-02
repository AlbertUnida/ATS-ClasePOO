// dto/candidate-login.dto.ts
import { IsEmail, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CandidateLoginDto {
    @IsEmail()
    @Transform(({ value }) => value?.toString().trim().toLowerCase())
    email!: string;

    @IsString()
    password!: string;
}
