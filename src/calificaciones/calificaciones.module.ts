import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Matricula } from '../matriculas/entities/matricula.entity';
import { MatriculaAsignatura } from '../matriculas/entities/matricula-asignatura.entity';
import { AsignaturaParalelo } from '../paralelos/entities/asignatura-paralelo.entity';
import { Docente } from '../docentes/entities/docente.entity';
import { User } from '../users/entities/user.entity';

import { CorreccionCalificacion } from './entities/correccion-calificacion.entity';
import { CalificacionesService } from './calificaciones.service';
import { CalificacionesController } from './calificaciones.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Matricula,
      MatriculaAsignatura,
      AsignaturaParalelo,
      Docente,
      User,
      CorreccionCalificacion,
    ]),
  ],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
  exports: [CalificacionesService],
})
export class CalificacionesModule {}