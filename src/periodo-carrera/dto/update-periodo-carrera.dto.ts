import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EstadoPeriodoCarrera, Jornada} from '../entities/periodo-carrera.entity';

export class UpdatePeriodoCarreraDto {
  @IsOptional()
  @IsUUID()
  versionMallaId?: string;

  @IsOptional()
  @IsEnum(Jornada)
  jornada?: Jornada;

  @IsOptional()
  @IsEnum(EstadoPeriodoCarrera)
  estado?: EstadoPeriodoCarrera;
}