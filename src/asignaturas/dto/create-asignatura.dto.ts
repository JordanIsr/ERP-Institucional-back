import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { EstadoAsignaturaCatalogo } from '../entities/asignatura.entity';

export class CreateAsignaturaDto {
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  horasSemanales?: number;

  @IsOptional()
  @IsEnum(EstadoAsignaturaCatalogo)
  estado?: EstadoAsignaturaCatalogo;
}