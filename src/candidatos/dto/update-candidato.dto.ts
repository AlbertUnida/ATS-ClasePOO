// dto/update-candidate.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCandidatoDto } from './create-candidato.dto';

// Omitimos campos no editables por update:
// export class UpdateCandidatoDto extends PartialType(
//     OmitType(CreateCandidatoDto, ['tenantSlug', 'createUser', 'password'] as const),
// ) { }

export class UpdateCandidatoDto extends PartialType(
    OmitType(CreateCandidatoDto, ['tenantSlug'] as const),
) { }


