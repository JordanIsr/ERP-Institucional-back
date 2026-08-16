import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentroEstudio } from './entities/centro-estudio.entity';
import { CentrosEstudioService } from './centros-estudio.service';
import { CentrosEstudioController } from './centros-estudio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CentroEstudio])],
  controllers: [CentrosEstudioController],
  providers: [CentrosEstudioService],
  exports: [CentrosEstudioService], // lo necesitará PeriodoCarreraModule
})
export class CentrosEstudioModule {}