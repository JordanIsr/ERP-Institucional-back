import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Estudiante } from '../estudiantes/entities/estudiante.entity';
import { Docente } from '../docentes/entities/docente.entity';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Estudiante,
      Docente,
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [
    TypeOrmModule,
    UsersService,
  ],
})
export class UsersModule {}