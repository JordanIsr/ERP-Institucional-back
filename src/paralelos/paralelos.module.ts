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

@Module({
  imports: [
    TypeOrmModule.forFeature([Paralelo, AsignaturaParalelo]),
    PeriodoCarreraModule,
    MallasModule,
    DocentesModule,
  ],
  providers: [ParaleloService, AsignaturaParaleloService],
  controllers: [ParaleloController, AsignaturaParaleloController],
  exports: [TypeOrmModule, ParaleloService, AsignaturaParaleloService],
})
export class ParalelosModule {}