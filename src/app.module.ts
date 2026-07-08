import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EstudiantesModule } from './estudiantes/estudiantes.module';

@Module({
  imports: [
    // Configuración de conexión a PostgreSQL
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432, // Puerto por defecto de Postgres
      username: 'postgres', // TU USUARIO DE POSTGRES
      password: 'postgres', // TU CONTRASEÑA DE POSTGRES
      database: 'erp_bd', // EL NOMBRE DE TU BASE DE DATOS
      autoLoadEntities: true,
      synchronize: true, // ⚠️ TRUE solo en desarrollo: crea/actualiza las tablas automáticamente
    }),
    UsersModule,
    AuthModule,
    EstudiantesModule,
  ],
})
export class AppModule {}