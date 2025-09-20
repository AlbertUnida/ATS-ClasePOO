import { PartialType } from '@nestjs/mapped-types';
import { CreateRolesPermisoDto } from './create-roles-permiso.dto';

export class UpdateRolesPermisoDto extends PartialType(CreateRolesPermisoDto) {}
