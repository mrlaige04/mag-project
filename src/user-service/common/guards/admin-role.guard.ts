import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    if (!req.user || !req.user.role) {
      throw new ForbiddenException('No user or role in session');
    }
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied: only admin allowed');
    }
    return true;
  }
}

