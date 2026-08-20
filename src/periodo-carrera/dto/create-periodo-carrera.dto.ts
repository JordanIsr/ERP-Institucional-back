import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { Jornada } from '../entities/periodo-carrera.entity';

export class CreatePeriodoCarreraDto {
  @IsUUID()
  periodoId!: string;

  @IsUUID()
  carreraId!: string;

  @IsUUID()
  @IsOptional()
  versionMallaId?: string;

  @IsUUID()
  centroEstudioId!: string;

  @IsEnum(Jornada)
  jornada!: Jornada;
}
