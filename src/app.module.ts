import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';
import { AcademicoModule } from './academico/academico.module';
import { AsignaturasModule } from './asignaturas/asignaturas.module';
import { DocentesModule } from './docentes/docentes.module';
import { PeriodosModule } from './periodos/periodos.module';
import { CarrerasModule } from './carreras/carreras.module';
import { MallasModule } from './mallas/mallas.module';
import { PeriodoCarreraModule } from './periodo-carrera/periodo-carrera.module';
import { ParalelosModule } from './paralelos/paralelos.module';
import { AulaModule } from './aula/aula.module';
import { CentrosEstudioModule } from './centros-estudio/centros-estudio.module';


@Module({
  imports: [
    // Configuración de conexión a PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433, // Puerto por defecto de Postgres
      username: 'postgres', // TU USUARIO DE POSTGRES
      password: 'postgres', // TU CONTRASEÑA DE POSTGRES
      database: 'yavirac_erp', // EL NOMBRE DE TU BASE DE DATOS
      autoLoadEntities: true,
      synchronize: true, // ⚠️ TRUE solo en desarrollo: crea/actualiza las tablas automáticamente
    }),
    UsersModule,
    AuthModule,
    EstudiantesModule,
    AcademicoModule,
    AsignaturasModule,
    DocentesModule,
    PeriodosModule, 
    CarrerasModule,
    MallasModule,
    AulaModule,
    PeriodoCarreraModule,
    ParalelosModule,
    CentrosEstudioModule,
  ],
})
export class AppModule {}