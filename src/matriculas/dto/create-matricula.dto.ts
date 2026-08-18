import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { TipoMatricula } from '../entities/matricula.entity';

export class CreateMatriculaDto {
  @IsUUID()
  estudianteId!: string;

  @IsUUID()
  periodoCarreraId!: string;

  @IsUUID()
  paraleloId!: string;

  @IsEnum(TipoMatricula)
  tipo!: TipoMatricula;

  /*
   * Solo es obligatorio en una matrícula de REPETICIÓN.
   * Allí se enviarán únicamente las materias reprobadas.
   */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  asignaturaParaleloIds?: string[];
}