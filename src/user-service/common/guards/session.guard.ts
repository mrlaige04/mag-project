import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy  } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (!sessionId) throw new UnauthorizedException('No session');
    try {
      const session: any = await firstValueFrom(this.authClient.send({ cmd: 'validate-session' }, sessionId));
      if (!session?.valid) throw new UnauthorizedException('Invalid session');
      req['user'] = session;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Session validation failed');
    }
  }
} 