import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionMalla } from './entities/version-malla.entity';
import { Nivel } from './entities/nivel.entity';
import { DetalleMalla } from './entities/detalle-malla.entity';
import { VersionMallaService } from './version-malla.service';
import { VersionMallaController } from './version-malla.controller';
import { NivelService } from './nivel.service';
import { NivelController } from './nivel.controller';
import { DetalleMallaService } from './detalle-malla.service';
import { DetalleMallaController } from './detalle-malla.controller';
import { CarrerasModule } from '../carreras/carreras.module';
import { AsignaturasModule } from '../asignaturas/asignaturas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VersionMalla, Nivel, DetalleMalla]),
    CarrerasModule,
    AsignaturasModule,
  ],
  providers: [VersionMallaService, NivelService, DetalleMallaService],
  controllers: [VersionMallaController, NivelController, DetalleMallaController],
  exports: [TypeOrmModule, VersionMallaService, NivelService, DetalleMallaService],
})
export class MallasModule {}