import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const error = exception.getResponse();
      return response.status(status).json(error);
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
      rpcError?.status || rpcError?.statusCode || exception?.status || exception?.statusCode || exception?.code;
    const status = Number.isInteger(Number(statusRaw)) ? Number(statusRaw) : 500;

    const errorResponse = {
      statusCode: status,
      message: rpcError?.message || exception?.message || 'Unknown error',
      error: statusMap[status] || 'Internal Server Error',
    };

    return response.status(status).json(errorResponse);
  }
}