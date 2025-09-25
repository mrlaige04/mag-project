import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
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
    };

    const status =
      exception?.status || exception?.statusCode || exception?.code || 400;

    const errorResponse = {
      statusCode: status,
      message: exception?.message || 'Unknown error',
      error: statusMap[status] || 'Bad Request',
    };

    return response.status(status).json(errorResponse);
  }
}