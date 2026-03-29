// apps/api/src/modules/fx/fx.module.ts
import { Module }      from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FxService }    from './fx.service';
import { FxController } from './fx.controller';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url:  config.get<string>('redis.url') ?? 'redis://localhost:6379',
      }),
    }),
  ],
  providers:   [FxService],
  controllers: [FxController],
  exports:     [FxService],
})
export class FxModule {}