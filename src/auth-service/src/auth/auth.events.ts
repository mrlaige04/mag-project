import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RedisService } from '../redis';

@Controller()
export class AuthEventsController {
  private readonly logger = new Logger(AuthEventsController.name);

  constructor(private readonly redisService: RedisService) {}

  @MessagePattern({ cmd: 'validate-session' })
  async validateSession(sessionId: string) {
    const session = await this.redisService.getSession(sessionId);
    if (!session) return { valid: false };
    return { valid: true, ...session };
  }
}
