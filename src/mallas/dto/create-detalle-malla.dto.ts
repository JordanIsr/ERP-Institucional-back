import { IsUUID } from 'class-validator';

export class CreateDetalleMallaDto {
  @IsUUID()
  nivelId!: string;

  @IsUUID()
  asignaturaId!: string;
}