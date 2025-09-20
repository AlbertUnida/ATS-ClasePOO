import { PartialType } from '@nestjs/mapped-types';
import { CreatePostulacionDto } from './create-postulacione.dto';

export class UpdatePostulacioneDto extends PartialType(CreatePostulacionDto) {}
