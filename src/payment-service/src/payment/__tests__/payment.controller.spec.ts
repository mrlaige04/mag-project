import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../payment.controller';
import { PaymentService } from '../payment.service';
import { JwtGuard, VerificationGuard } from '@app/common';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: any;

  beforeEach(async () => {
    const mockPaymentService = {
      transfer: jest.fn(),
      getHistory: jest.fn(),
      getById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: JwtGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: VerificationGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: 'AUTH_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'VERIFICATION_SERVICE', useValue: { send: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call transfer', async () => {
    service.transfer.mockResolvedValue({ id: 't1' });
    const req = { user: { userId: 'u1' } };
    const dto = { senderCardNumber: '111', receiverCardNumber: '222', amount: 10, currency: 'UAH' };
    const result = await controller.transfer(dto as any, req as any);
    expect(result).toEqual({ id: 't1' });
    expect(service.transfer).toHaveBeenCalledWith(dto, 'u1');
  });

  it('should call getHistory', async () => {
    service.getHistory.mockResolvedValue([{ id: 't1' }]);
    const req = { user: { userId: 'u1' } };
    const result = await controller.getHistory(req as any);
    expect(result).toEqual([{ id: 't1' }]);
    expect(service.getHistory).toHaveBeenCalledWith('u1');
  });

  it('should call getById', async () => {
    service.getById.mockResolvedValue({ id: 't2' });
    const req = { user: { userId: 'u1' } };
    const result = await controller.getById('t2', req as any);
    expect(result).toEqual({ id: 't2' });
    expect(service.getById).toHaveBeenCalledWith('t2', 'u1');
  });
}); 