// dto/create-candidate.dto.ts
// import { IsEmail, IsNotEmpty, IsOptional, IsString, IsObject, IsUrl, ValidateIf, MinLength} from 'class-validator';
// import { ApiProperty } from '@nestjs/swagger';

// export class CreateCandidatoDto {
//     @IsString() @IsNotEmpty() tenantSlug: string;
//     @IsString() @IsNotEmpty() nombre: string;
//     @IsEmail() email: string;
//     @IsOptional() @IsString() telefono?: string;
//     @IsOptional() /*@IsUrl()*/ cvUrl?: string;
//     @IsOptional() @IsObject() perfil?: Record<string, any>; // libre: skills, links, etc.

//     @IsOptional() createUser?: boolean;
//     @ValidateIf(o => o.createUser) @IsString() @MinLength(8)
//     @ApiProperty({ required: false, writeOnly: true })
//     password?: string;
// }


// dto/create-candidate.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsObject, IsUrl, ValidateIf, MinLength, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCandidatoDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  tenantSlug: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  @Transform(({ value }) => value?.toString().trim())
  nombre: string;

  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  email: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  @Transform(({ value }) => value?.toString().trim())
  telefono?: string;

  @ApiPropertyOptional({ description: 'URL del CV (http/https)' })
  @IsOptional()
  // Opción estricta:
  // @IsUrl({ require_protocol: true }, { message: 'cvUrl debe ser http(s) válido' })
  // Opción relajada (acepta http/https sin validar TLD):
  //@Matches(/^https?:\/\/\S+$/i, { message: 'cvUrl debe iniciar con http(s)://' })
  cvUrl?: string;

  @ApiPropertyOptional({ description: 'Objeto libre: skills, links, etc.' })
  @IsOptional() @IsObject()
  perfil?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Si true, también crea usuario con rol CANDIDATO' })
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  createUser?: boolean;

  @ApiPropertyOptional({ required: false, writeOnly: true })
  @ValidateIf(o => o.createUser === true)
  @IsString() @MinLength(8)
  password?: string;
}
