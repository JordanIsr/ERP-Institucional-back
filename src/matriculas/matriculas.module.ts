import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Matricula } from './entities/matricula.entity';
import { MatriculaAsignatura } from './entities/matricula-asignatura.entity';
import { SolicitudMatricula } from '../solicitudes-matricula/entities/solicitud-matricula.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { PeriodoCarrera } from '../periodo-carrera/entities/periodo-carrera.entity';
import { Paralelo } from '../paralelos/entities/paralelo.entity';
import { AsignaturaParalelo } from '../paralelos/entities/asignatura-paralelo.entity';

import { MatriculasService } from './matriculas.service';
import { MatriculasController } from './matriculas.controller';
import { DocumentoMatricula } from 'src/documentos-matricula/entities/documento-matricula.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Matricula,
      MatriculaAsignatura,
      Estudiante,
      PeriodoCarrera,
      Paralelo,
      AsignaturaParalelo,
      SolicitudMatricula,
      DocumentoMatricula
    ]),
  ],
  controllers: [MatriculasController],
  providers: [MatriculasService],
  exports: [
    MatriculasService,
    TypeOrmModule,
  ],
})
export class MatriculasModule {}