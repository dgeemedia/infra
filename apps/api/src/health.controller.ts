// apps/api/src/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from './database/prisma.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {

  constructor(
    private readonly health:   HealthCheckService,
    private readonly memory:   MemoryHealthIndicator,
    private readonly prisma:   PrismaService,

  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check — used by AWS ALB and monitoring' })
  check() {
    return this.health.check([
      // Memory — alert if heap > 512MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }
}
