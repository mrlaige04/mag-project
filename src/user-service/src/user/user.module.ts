import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEventsController } from './user.events';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SessionGuard, AdminRoleGuard } from '../../common/guards';
import { ConfigService } from '@nestjs/config';

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
        name: 'HISTORY_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_QUEUE_HISTORY'),
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  controllers: [UserController, UserEventsController],
  providers: [UserService, SessionGuard, AdminRoleGuard],
  exports: [UserService],
})
export class UserModule {}
