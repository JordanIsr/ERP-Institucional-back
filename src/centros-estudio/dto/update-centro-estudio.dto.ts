import { PartialType } from '@nestjs/mapped-types';
import { CreateCentroEstudioDto } from './create-centro-estudio.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoCentroEstudio } from '../entities/centro-estudio.entity';

export class UpdateCentroEstudioDto extends PartialType(CreateCentroEstudioDto) {
  @IsEnum(EstadoCentroEstudio)
  @IsOptional()
  estado?: EstadoCentroEstudio;
}