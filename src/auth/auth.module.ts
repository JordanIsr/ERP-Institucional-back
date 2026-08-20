import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <-- Importamos JWT
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    // Configuramos el módulo JWT
    JwtModule.register({
      global: true,
      secret: 'MI_CLAVE_SECRETA_ERP_2026', // En el futuro esto irá en un archivo .env
      signOptions: { expiresIn: '8h' }, // El token durará 8 horas
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}