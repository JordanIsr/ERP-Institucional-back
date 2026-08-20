import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RechazarSolicitudDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'El motivo de rechazo debe ser específico (mínimo 5 caracteres).' })
  motivoRechazo!: string;
}