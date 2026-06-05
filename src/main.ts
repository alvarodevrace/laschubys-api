import './instrument.js';
import 'dotenv/config';
import 'reflect-metadata';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './shared/config/env';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.use(helmet());

  app.enableCors({
    origin: env.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api', { exclude: ['sitemap.xml'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.port);
  Logger.log(`Las Chubys API en http://localhost:${env.port}`, 'Bootstrap');
}

void bootstrap();
