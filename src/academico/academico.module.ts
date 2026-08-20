import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asignatura } from './entities/asignatura.entity';
import { HistorialAcademico } from './entities/historial-academico.entity';
import { ComprobantePago } from './entities/comprobante-pago.entity';
import { AcademicoService } from './academico.service';
import { AcademicoController } from './academico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Asignatura, HistorialAcademico, ComprobantePago])],
  providers: [AcademicoService],
  controllers: [AcademicoController],
  exports: [AcademicoService], // lo necesita EstudiantesModule
})
export class AcademicoModule {}