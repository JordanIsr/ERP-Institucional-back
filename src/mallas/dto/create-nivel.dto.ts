import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateNivelDto {
  @IsUUID()
  versionMallaId!: string;

  @IsInt()
  @Min(1)
  numero!: number;

  @IsOptional()
  @IsString()
  nombre?: string;
}