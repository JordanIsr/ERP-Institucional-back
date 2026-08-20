import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoNota } from '../tipo-nota.enum';

export class RegistrarNotaDto {
  @IsEnum(TipoNota)
  tipoNota!: TipoNota;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'La nota debe ser un número con máximo dos decimales.',
    },
  )
  @Min(0)
  @Max(10)
  nota!: number;
}