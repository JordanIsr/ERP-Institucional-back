import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- Asegúrate de importar esto
import { EstudiantesService } from './estudiantes.service';
import { EstudiantesController } from './estudiantes.controller';
import { Estudiante } from './entities/estudiante.entity'; // <-- Importa tu entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([Estudiante]) // <-- Registramos la tabla aquí para que el servicio la use
  ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
})
export class EstudiantesModule {}