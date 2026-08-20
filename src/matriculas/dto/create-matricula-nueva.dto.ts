import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateMatriculaNuevaDto {
  @IsString()
  @Matches(/^\d{10}$/, {
    message:
      'La cédula debe contener 10 dígitos.',
  })
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
  @Matches(/^\d{10}$/, {
    message:
      'El teléfono debe contener 10 dígitos.',
  })
  telefono?: string;

  @IsUUID()
  periodoCarreraId!: string;

  @IsUUID()
  paraleloId!: string;
}