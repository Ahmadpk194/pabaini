import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // common prefix api/v1 for all routes
  app.setGlobalPrefix('api/v1');

  // enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',
  //     'https://pabaini-production.up.railway.app',
  //   ],
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });

  // standard response format
  app.useGlobalInterceptors(new TransformInterceptor());

  // standard error format
  app.useGlobalFilters(new HttpExceptionFilter());

  // Explicitly bind to port and '0.0.0.0' so Railway can route external traffic here
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();