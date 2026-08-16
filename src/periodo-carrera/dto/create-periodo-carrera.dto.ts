import { IsUUID, IsEnum } from 'class-validator';
import { Jornada } from '../entities/periodo-carrera.entity';

export class CreatePeriodoCarreraDto {
  @IsUUID()
  periodoId!: string;

  @IsUUID()
  carreraId!: string;

  @IsUUID()
  versionMallaId!: string;

  @IsUUID()
  centroEstudioId!: string;

  @IsEnum(Jornada)
  jornada!: Jornada;
}