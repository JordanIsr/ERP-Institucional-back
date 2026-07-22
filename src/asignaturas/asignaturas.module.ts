import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asignatura } from './entities/asignatura.entity';
import { AsignaturasService } from './asignaturas.service';
import { AsignaturasController } from './asignaturas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Asignatura])],
  providers: [AsignaturasService],
  controllers: [AsignaturasController],
  exports: [TypeOrmModule, AsignaturasService],
})
export class AsignaturasModule {}