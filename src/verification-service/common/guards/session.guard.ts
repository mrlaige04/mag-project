import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate, OnModuleInit {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.authClient.connect();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (!sessionId) throw new UnauthorizedException('No session');
    try {
      const session: any = await firstValueFrom(
        this.authClient.send({ cmd: 'validate-session' }, sessionId).pipe(timeout(5000))
      );
      console.log('session', session);
      if (!session?.valid) throw new UnauthorizedException('Invalid session');
      req['user'] = session;
      return true;
    } catch (e) {
      console.error('Session validation error:', e.message);
      throw new UnauthorizedException('Session validation failed');
    }
  }
} 