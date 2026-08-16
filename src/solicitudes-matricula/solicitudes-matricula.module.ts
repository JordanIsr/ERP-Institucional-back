import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudMatricula } from './entities/solicitud-matricula.entity';
import { SolicitudesMatriculaService } from './solicitudes-matricula.service';
import { SolicitudesMatriculaController } from './solicitudes-matricula.controller';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { PeriodoCarreraModule } from '../periodo-carrera/periodo-carrera.module';
import { ParalelosModule } from '../paralelos/paralelos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudMatricula]),
    EstudiantesModule,
    PeriodoCarreraModule,
    ParalelosModule,
  ],
  controllers: [SolicitudesMatriculaController],
  providers: [SolicitudesMatriculaService],
  exports: [SolicitudesMatriculaService],
})
export class SolicitudesMatriculaModule {}