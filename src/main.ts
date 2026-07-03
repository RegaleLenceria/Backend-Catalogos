import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Permite peticiones desde el frontend
  app.use(json({ limit: '250mb' }));
  app.use(urlencoded({ extended: true, limit: '250mb' }));
  
  // Crear carpeta uploads si no existe
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }
  
  // Servir archivos estáticos de la carpeta uploads
  app.use('/uploads', express.static(uploadsPath));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
