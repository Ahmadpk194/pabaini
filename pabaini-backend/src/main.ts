import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // common prefix api/v1 for all routes
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: '*',
  });

  // enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // standard response format
  app.useGlobalInterceptors(new TransformInterceptor());

  // standard error format
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
