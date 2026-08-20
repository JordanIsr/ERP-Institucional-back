import { IsString, IsNotEmpty, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';

export class UpdateAulaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  bloque?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacidadMaxima?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}