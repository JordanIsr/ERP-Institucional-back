import { IsUUID } from 'class-validator';

export class CreateAsignaturaParaleloDto {
  @IsUUID()
  paraleloId!: string;

  @IsUUID()
  detalleMallaId!: string;

  @IsUUID()
  docenteId!: string;
}