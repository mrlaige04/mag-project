import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AllRpcExceptionsFilter } from '../common/exceptions';

async function bootstrap() {
  const appContext = await NestFactory.create(AppModule);
  const configService = appContext.get(ConfigService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URL')],
        queue: configService.get<string>('RABBITMQ_QUEUE'),
        queueOptions: {
          durable: true,
        },
      },
    });

  microservice.useGlobalFilters(new AllRpcExceptionsFilter());
  await microservice.listen();
  console.log('History worker is listening for RabbitMQ messages...');
}

bootstrap();
