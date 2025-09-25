import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModule } from '../payment.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma';

describe('PaymentModule', () => {
  it('should compile', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PaymentModule,
      ],
      providers: [
        { provide: PrismaService, useValue: {} },
        { provide: 'CARD_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn() } },
      ],
    }).compile();
    expect(module).toBeDefined();
  });
}); 