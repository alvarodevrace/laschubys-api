import 'dotenv/config';
import './instrument.js';
import 'reflect-metadata';
import helmet from 'helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './shared/config/env';
import { ApiExceptionFilter } from './shared/http/api-exception.filter';
import { CsrfService } from './shared/csrf/csrf.service';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  app.enableCors({
    origin: env.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // CSRF double-submit cookie: ensure every request has a csrf-token cookie
  const csrfService = app.get(CsrfService);
  app.use((req: Request, res: Response, next: () => void) => {
    if (!csrfService.getCsrfTokenFromCookie(req)) {
      const token = csrfService.generateToken();
      csrfService.setCsrfCookie(res, token);
    }
    next();
  });

  app.setGlobalPrefix('api', { exclude: ['sitemap.xml'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.listen(env.port);
  Logger.log(`Las Chubys API en http://localhost:${env.port}`, 'Bootstrap');
}

void bootstrap();
