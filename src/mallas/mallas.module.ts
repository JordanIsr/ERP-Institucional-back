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
import { MallaWizardController } from './malla-wizard.controller';
import { MallaWizardService } from './malla-wizard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VersionMalla, Nivel, DetalleMalla]),
    CarrerasModule,
    AsignaturasModule,
  ],
  providers: [VersionMallaService, NivelService, DetalleMallaService, MallaWizardService],
  controllers: [VersionMallaController, NivelController, DetalleMallaController, MallaWizardController],
  exports: [TypeOrmModule, VersionMallaService, NivelService, DetalleMallaService],
})
export class MallasModule {}