import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { EstadoPeriodo } from '../entities/periodo-academico.entity';

export class CreatePeriodoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsDateString()
  fechaInicio!: string;

  @IsDateString()
  fechaFin!: string;

  @IsOptional()
  @IsEnum(EstadoPeriodo)
  estado?: EstadoPeriodo;
}