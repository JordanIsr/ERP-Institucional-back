import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paralelo } from './entities/paralelo.entity';
import { AsignaturaParalelo } from './entities/asignatura-paralelo.entity';
import { ParaleloService } from './paralelo.service';
import { ParaleloController } from './paralelo.controller';
import { AsignaturaParaleloService } from './asignatura-paralelo.service';
import { AsignaturaParaleloController } from './asignatura-paralelo.controller';
import { PeriodoCarreraModule } from '../periodo-carrera/periodo-carrera.module';
import { MallasModule } from '../mallas/mallas.module';
import { DocentesModule } from '../docentes/docentes.module';
import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Paralelo, AsignaturaParalelo, Horario]),
    PeriodoCarreraModule,
    MallasModule,
    DocentesModule,
  ],
  providers: [ParaleloService, AsignaturaParaleloService, HorarioService],
  controllers: [ParaleloController, AsignaturaParaleloController, HorarioController],
  exports: [TypeOrmModule, ParaleloService, AsignaturaParaleloService, HorarioService],
})
export class ParalelosModule {}