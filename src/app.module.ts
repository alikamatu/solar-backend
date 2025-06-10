import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, HealthController],
  providers: [HealthService],
})
export class AppModule {}