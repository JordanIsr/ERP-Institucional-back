import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Habilitar CORS para que Angular pueda conectarse sin errores
  app.enableCors(); 

  // 2. Agregar el prefijo "api" a todas las rutas
  app.setGlobalPrefix('api'); 

  await app.listen(3000);
}
bootstrap();