import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './auth/roles';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const admin = await usersService.crear({
      nombre: 'Administrador Principal',
      email: 'admin@yavirac.edu.ec', // cámbialo por el correo real que quieras usar
      password: 'CambiaEstaClave123', // cámbiala, y luego cambia la contraseña desde la app
      role: UserRole.ADMIN,
    });

    console.log('✅ Admin creado con éxito:', admin);
  } catch (err) {
    console.error('❌ Error creando el admin (puede que ya exista):', err.message);
  }

  await app.close();
}

bootstrap();