// dto/create-candidate.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsObject, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCandidatoDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  tenantSlug: string; // Interno: quién crea decide el tenant

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
  //@Matches(/^https?:\/\/\S+$/i, { message: 'cvUrl debe iniciar con http(s)://' })
  cvUrl?: string;

  @ApiPropertyOptional({ description: 'Objeto libre: skills, links, etc.' })
  @IsOptional() @IsObject()
  perfil?: Record<string, any>;
}



//modelo prisma
// model Candidatos {
//   id         String   @id @default(cuid())
//   tenantId   String
//   tenant     Tenants  @relation(fields: [tenantId], references: [id])
//   nombre     String
//   email      String
//   telefono   String?
//   cvUrl      String?
//   perfilJson String?
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt // <--- NUEVO

//   // --- Auditoría mínima ---
//   deletedAt          DateTime?
//   // (Opcional) autoría
//   createdByUserId    String?
//   updatedByUserId    String?
//   createdByAccountId String?
//   updatedByAccountId String?

//   postulaciones Postulaciones[]
//   Usuarios      Usuarios[]

//   cuentaId String?
//   cuenta   CandidatoCuentas? @relation(fields: [cuentaId], references: [id])

//   @@unique([tenantId, email]) // <--- cambia index -> unique
//   @@index([tenantId]) // <--- NUEVO
//   @@index([cuentaId])
//   @@index([deletedAt]) // útil para filtrar activos
// }