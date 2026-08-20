import { IsUUID, IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { EstadoVersionMalla } from '../entities/version-malla.entity';

export class CreateVersionMallaDto {
  @IsUUID()
  carreraId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsDateString()
  fechaVigenciaInicio!: string;

  @IsOptional()
  @IsDateString()
  fechaVigenciaFin?: string;

  @IsOptional()
  @IsEnum(EstadoVersionMalla)
  estado?: EstadoVersionMalla;
}