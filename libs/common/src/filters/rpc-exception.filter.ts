import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> | void {
    const type = host.getType();

    if (type === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      if (exception instanceof HttpException) {
        const status = exception.getStatus();
        const error = exception.getResponse();
        response.status(status).json(error);
        return;
      }

      // Handle Prisma Unique Constraint Error
      if (exception.code === 'P2002') {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: `Unique constraint failed on fields: ${exception.meta?.target}`,
          error: 'Conflict',
        });
        return;
      }

      const statusMap: Record<number, string> = {
        409: 'Conflict',
        404: 'Not Found',
        403: 'Forbidden',
        401: 'Unauthorized',
        500: 'Internal Server Error',
        400: 'Bad Request',
        402: 'Payment Required',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        410: 'Gone',
        411: 'Length Required',
        501: 'Not Implemented',
      };

      const rpcError = exception?.error || exception;
      const statusRaw =
        rpcError?.status ||
        rpcError?.statusCode ||
        exception?.status ||
        exception?.statusCode ||
        exception?.code;
      const status = Number.isInteger(Number(statusRaw))
        ? Number(statusRaw)
        : 500;

      const errorResponse = {
        statusCode: status,
        message: rpcError?.message || exception?.message || 'Unknown error',
        error: statusMap[status] || 'Internal Server Error',
      };

      response.status(status).json(errorResponse);
      return;
    }

    // RPC Handling
    const error =
      exception instanceof RpcException ? exception.getError() : exception;
    const errorObj = typeof error === 'object' ? error : { message: error };

    return throwError(() => ({
      status: errorObj.status || errorObj.statusCode || 500,
      message: errorObj.message || 'Internal error',
    }));
  }
}

