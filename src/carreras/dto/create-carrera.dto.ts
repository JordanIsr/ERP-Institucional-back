import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { EstadoCarrera } from '../entities/carrera.entity';

export class CreateCarreraDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsOptional()
  @IsEnum(EstadoCarrera)
  estado?: EstadoCarrera;
}