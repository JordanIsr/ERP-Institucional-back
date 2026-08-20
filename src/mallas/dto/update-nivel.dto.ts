import { IsOptional, IsInt, Min, IsString } from 'class-validator';

export class UpdateNivelDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  numero?: number;

  @IsOptional()
  @IsString()
  nombre?: string;
}