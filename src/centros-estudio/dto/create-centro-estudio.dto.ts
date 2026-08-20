import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCentroEstudioDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  codigo!: string;
}