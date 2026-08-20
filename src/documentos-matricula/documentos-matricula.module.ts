import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentoMatricula } from './entities/documento-matricula.entity';
import { SolicitudMatricula } from '../solicitudes-matricula/entities/solicitud-matricula.entity';
import { User } from '../users/entities/user.entity';

import { DocumentosMatriculaService } from './documentos-matricula.service';
import { DocumentosMatriculaController } from './documentos-matricula.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentoMatricula,
      SolicitudMatricula,
      User,
    ]),
  ],
  controllers: [
    DocumentosMatriculaController,
  ],
  providers: [
    DocumentosMatriculaService,
  ],
  exports: [
    DocumentosMatriculaService,
    TypeOrmModule,
  ],
})
export class DocumentosMatriculaModule {}