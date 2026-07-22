import { PartialType } from '@nestjs/mapped-types';
import { CreateVersionMallaDto } from './create-version-malla.dto';

export class UpdateVersionMallaDto extends PartialType(CreateVersionMallaDto) {}