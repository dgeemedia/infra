// apps/api/src/modules/van/van.module.ts
import { Module }        from '@nestjs/common';
import { VanService }    from './van.service';
import { VanController } from './van.controller';

@Module({
  providers:   [VanService],
  controllers: [VanController],
  exports:     [VanService],
})
export class VanModule {}