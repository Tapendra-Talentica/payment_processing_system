import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../config/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime: number;

  constructor(private readonly prisma: PrismaService) {
    this.startTime = Date.now();
  }

  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      example: {
        status: 'ok',
        uptime: 123.456,
        timestamp: '2024-01-15T10:30:00.000Z',
        database: 'connected',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'API is unhealthy',
  })
  async check() {
    const isDbHealthy = await this.prisma.isHealthy();
    const uptime = (Date.now() - this.startTime) / 1000;

    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      uptime: parseFloat(uptime.toFixed(3)),
      timestamp: new Date().toISOString(),
      database: isDbHealthy ? 'connected' : 'disconnected',
    };
  }
}
