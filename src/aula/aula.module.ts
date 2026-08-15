import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aula } from './entities/aula.entity';
import { AulaService } from './aula.service';
import { AulaController } from './aula.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aula])],
  controllers: [AulaController],
  providers: [AulaService],
  exports: [AulaService], // <--- Imprescindible para que ParaleloService lo pueda usar
})
export class AulaModule {}