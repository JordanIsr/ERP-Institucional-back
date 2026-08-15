import { IsString, IsNotEmpty, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';

export class CreateAulaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  bloque?: string;

  @IsInt()
  @Min(1)
  capacidadMaxima: number;
}