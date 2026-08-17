import { PartialType } from '@nestjs/mapped-types';
import { CreatePeriodoCarreraDto } from './create-periodo-carrera.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoPeriodoCarrera } from '../entities/periodo-carrera.entity';

export class UpdatePeriodoCarreraDto extends PartialType(CreatePeriodoCarreraDto) {
  @IsEnum(EstadoPeriodoCarrera)
  @IsOptional()
  estado?: EstadoPeriodoCarrera;
}