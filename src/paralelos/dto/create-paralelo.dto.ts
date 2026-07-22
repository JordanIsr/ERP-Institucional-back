import { IsUUID, IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateParaleloDto {
  @IsUUID()
  periodoCarreraId!: string;

  @IsUUID()
  nivelId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsInt()
  @Min(1)
  cupoMaximo!: number;
}