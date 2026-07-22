import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodoCarreraDto } from './create-periodo-carrera.dto';

export class UpdatePeriodoCarreraDto extends PartialType(CreatePeriodoCarreraDto) {}