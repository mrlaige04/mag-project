import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../src/redis/redis.service';
import { Request } from 'express';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (!sessionId) throw new UnauthorizedException('No session');
    const session = await this.redisService.getSession(sessionId);
    if (!session) throw new UnauthorizedException('Invalid session');
    req['user'] = session;
    return true;
  }
} 