import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodoCarrera } from './entities/periodo-carrera.entity';
import { PeriodoCarreraService } from './periodo-carrera.service';
import { PeriodoCarreraController } from './periodo-carrera.controller';
import { PeriodosModule } from '../periodos/periodos.module';
import { CarrerasModule } from '../carreras/carreras.module';
import { MallasModule } from '../mallas/mallas.module';
import { CentrosEstudioModule } from '../centros-estudio/centros-estudio.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PeriodoCarrera]),
    PeriodosModule,
    CarrerasModule,
    MallasModule,
    CentrosEstudioModule,
  ],
  providers: [PeriodoCarreraService],
  controllers: [PeriodoCarreraController],
  exports: [TypeOrmModule, PeriodoCarreraService],
})
export class PeriodoCarreraModule {}