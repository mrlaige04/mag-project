import { Catch, ArgumentsHost, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter<any> {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    const error = exception instanceof RpcException 
      ? exception.getError() 
      : exception;
    
    const errorObj = typeof error === 'object' ? error : { message: error };
    
    return throwError(() => ({
      status: errorObj.status || errorObj.statusCode || 500,
      message: errorObj.message || 'Internal error',
    }));
  }
} 