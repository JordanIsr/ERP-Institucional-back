import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrera } from './entities/carrera.entity';
import { CarrerasService } from './carreras.service';
import { CarrerasController } from './carreras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrera])],
  providers: [CarrerasService],
  controllers: [CarrerasController],
  exports: [TypeOrmModule, CarrerasService],
})
export class CarrerasModule {}