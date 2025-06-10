import { Injectable } from '@nestjs/common';
import { HealthStatusDto } from './dto/health-status.dto';

@Injectable()
export class HealthService {
  getStatus(): HealthStatusDto {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }
}