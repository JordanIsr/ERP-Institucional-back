import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RechazarDocumentoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message:
      'El motivo debe tener al menos 5 caracteres.',
  })
  motivo!: string;
}