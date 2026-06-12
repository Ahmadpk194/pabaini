import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),

  autoLoadEntities: true,

  synchronize: config.get('NODE_ENV') !== 'production',

  ssl:
    config.get('NODE_ENV') === 'production'
      ? { rejectUnauthorized: false }
      : false,
});