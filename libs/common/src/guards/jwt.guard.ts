import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

interface JwtUserPayload {
  sub: string;
  role?: string;
  [key: string]: any;
}

@Injectable()
export class JwtGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const authHeader = (req.headers['authorization'] ||
      req.headers['Authorization']) as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No bearer token provided');
    }

    const token = authHeader.slice(7).trim();

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      const payload = jwt.verify(token, secret) as JwtUserPayload;

      (req as any).user = {
        id: payload.sub,
        userId: payload.sub,
        role: payload.role,
        ...payload,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}


