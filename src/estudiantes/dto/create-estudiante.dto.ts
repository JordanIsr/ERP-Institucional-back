import { IsString, IsEmail, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoMatricula } from '../entities/estudiante.entity';

export class CreateEstudianteDto {
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @IsEmail()
  correo!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  carrera!: string;

  @IsString()
  @IsNotEmpty()
  periodo!: string;

  @IsString()
  @IsNotEmpty()
  jornada!: string;

  @IsOptional()
  @IsEnum(EstadoMatricula)
  estado?: EstadoMatricula;
}