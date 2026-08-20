import {IsNotEmpty, IsString, MinLength } from 'class-validator';

import { RegistrarNotaDto } from './registrar-nota.dto';

export class CorregirNotaDto extends RegistrarNotaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message:
      'El motivo debe tener al menos 5 caracteres.',
  })
  motivo!: string;
}