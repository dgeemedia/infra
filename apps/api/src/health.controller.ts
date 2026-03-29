import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly health:   HealthCheckService,
    private readonly memory:   MemoryHealthIndicator,
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
