import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodoAcademico } from './entities/periodo-academico.entity';
import { PeriodosService } from './periodos.service';
import { PeriodosController } from './periodos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodoAcademico])],
  providers: [PeriodosService],
  controllers: [PeriodosController],
  exports: [TypeOrmModule, PeriodosService],
})
export class PeriodosModule {}