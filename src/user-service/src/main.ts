import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import { AllRpcExceptionsFilter } from '../common/exceptions';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.useGlobalFilters(new AllRpcExceptionsFilter());
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
  });

  app
    .getMicroservices()
    .forEach((ms) => ms.useGlobalFilters(new AllRpcExceptionsFilter()));

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT') ?? 3001;

  await app.listen(port);
  console.log(`User Service is running on http://localhost:${port}`);
}

bootstrap();
