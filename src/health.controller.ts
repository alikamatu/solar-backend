import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthStatusDto } from './dto/health-status.dto';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthStatusDto {
    return this.healthService.getStatus();
  }
}