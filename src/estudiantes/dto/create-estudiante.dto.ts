import {IsString, IsEmail, IsOptional, IsNotEmpty,} from 'class-validator';

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
}