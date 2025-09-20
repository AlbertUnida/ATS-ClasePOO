// import { PartialType } from '@nestjs/mapped-types';
// import { CreateCandidatoDto } from './create-candidato.dto';

// export class UpdateCandidatoDto extends PartialType(CreateCandidatoDto) {}


// dto/update-candidate.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCandidatoDto } from './create-candidato.dto';

// Omitimos campos no editables por update:
export class UpdateCandidatoDto extends PartialType(
    OmitType(CreateCandidatoDto, ['tenantSlug', 'createUser', 'password'] as const),
) { }

