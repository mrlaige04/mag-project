import { Module } from '@nestjs/common';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { HistoryEventsController } from './history.events';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_QUEUE_AUTH'),
            queueOptions: { durable: true },
          },
        }),
      },
      {
        name: 'VERIFICATION_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_QUEUE_VERIFICATION'),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [HistoryController, HistoryEventsController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
