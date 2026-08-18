import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudMatricula } from './entities/solicitud-matricula.entity';
import { SolicitudesMatriculaService } from './solicitudes-matricula.service';
import { SolicitudesMatriculaController } from './solicitudes-matricula.controller';
import { EstudiantesModule } from '../estudiantes/estudiantes.module';
import { PeriodoCarreraModule } from '../periodo-carrera/periodo-carrera.module';
import { ParalelosModule } from '../paralelos/paralelos.module';
import { MatriculasModule } from '../matriculas/matriculas.module';
import { DocumentoMatricula } from 'src/documentos-matricula/entities/documento-matricula.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudMatricula, DocumentoMatricula]),
    EstudiantesModule,
    PeriodoCarreraModule,
    ParalelosModule,
    MatriculasModule
  ],
  controllers: [SolicitudesMatriculaController],
  providers: [SolicitudesMatriculaService],
  exports: [SolicitudesMatriculaService],
})
export class SolicitudesMatriculaModule {}