import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom, timeout } from 'rxjs';

interface RequestWithUser extends Request {
    user?: {
      id: string;
      role: string;
      [key: string]: any;
    };
  }

@Injectable()
export class VerificationGuard implements CanActivate, OnModuleInit {
  constructor(
    @Inject('VERIFICATION_SERVICE') private readonly verificationClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.verificationClient.connect();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('No user id in session');
  
    const status: any = await firstValueFrom(
        this.verificationClient.send({ cmd: 'get-verification-status' }, userId).pipe(timeout(5000))
    );
  
    if (!status || status.status !== 'approved') {
        throw new ForbiddenException('User is not verified');
    }
    return true;
    
  }
}

