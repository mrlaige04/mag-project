import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

interface RequestWithUser extends Request {
    user?: {
      id: string;
      role: string;
      [key: string]: any;
    };
  }

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(
    @Inject('VERIFICATION_SERVICE') private readonly verificationClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('No user id in session');
  
    const status: any = await firstValueFrom(
        this.verificationClient.send({ cmd: 'get-verification-status' }, userId)
    );

    console.log(status);
  
    if (!status || status.status !== 'approved') {
        throw new ForbiddenException('User is not verified');
    }
    return true;
    
  }
}