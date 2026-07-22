import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);


  
  // 1. Habilitar CORS para que Angular pueda conectarse sin errores
  app.enableCors(); 

  // 2. Agregar el prefijo "api" a todas las rutas
  app.setGlobalPrefix('api'); 

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // descarta cualquier campo que no esté en el DTO
      forbidNonWhitelisted: true, // rechaza la petición si mandan campos extra no permitidos
      transform: true,           // convierte tipos automáticamente (ej. strings de query params a number)
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
bootstrap();