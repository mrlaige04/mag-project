import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { RpcExceptionFilter } from '@app/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.useGlobalFilters(new RpcExceptionFilter());
  app.enableShutdownHooks();
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN') || '*',
    credentials: true,
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: configService.get<string>('RABBITMQ_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  }, { inheritAppConfig: true });

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT') ?? 3001;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('User Service')
    .setDescription('User service API')
    .setVersion('1.0.0')
    .addCookieAuth('sessionId')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('users/docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      requestInterceptor: (req) => {
        req.credentials = 'include';
        return req;
      },
    },
  });

  await app.listen(port);
  console.log(`User Service is running on http://localhost:${port}`);
}

bootstrap();
