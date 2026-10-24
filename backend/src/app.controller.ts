import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiResponse({
    status: 200,
    content: { 'text/html': { schema: { type: 'string' } } },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      required: ['status', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
