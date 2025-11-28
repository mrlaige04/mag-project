import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { RpcExceptionFilter } from '@app/common';

async function bootstrap() {
  const appContext = await NestFactory.create(AppModule);
  const configService = appContext.get(ConfigService);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URL')],
        queue: configService.get<string>('RABBITMQ_QUEUE'),
        queueOptions: { durable: true },
      },
    });

  microservice.useGlobalFilters(new RpcExceptionFilter());
  await microservice.listen();
  console.log('Auth Worker is listening for RabbitMQ messages...');
}
bootstrap();
