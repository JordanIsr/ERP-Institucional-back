import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';

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
      entities: [User],
      synchronize: true, // ⚠️ TRUE solo en desarrollo: crea/actualiza las tablas automáticamente
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}