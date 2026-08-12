import { IsUUID, IsString, IsNotEmpty, IsDateString, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class NivelRapidoDto {
  @IsInt()
  @Min(1)
  numero!: number;

  @IsArray()
  @IsString({ each: true })
  asignaturas!: string[]; // solo nombres, el sistema resuelve el resto
}

export class CrearMallaRapidaDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NivelRapidoDto)
  niveles!: NivelRapidoDto[];
}