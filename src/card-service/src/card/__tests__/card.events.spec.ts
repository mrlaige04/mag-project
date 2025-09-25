import { Test, TestingModule } from '@nestjs/testing';
import { CardEventsController } from '../card.events';
import { CardService } from '../card.service';

describe('CardEventsController', () => {
  let controller: CardEventsController;
  let service: CardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardEventsController],
      providers: [
        {
          provide: CardService,
          useValue: {
            getCardByNumber: jest.fn(),
            transfer: jest.fn(),
            findAllByUser: jest.fn(),
          },
        },
        { provide: 'AUTH_SERVICE', useValue: { send: jest.fn() } },
      ],
    }).compile();

    controller = module.get<CardEventsController>(CardEventsController);
    service = module.get<CardService>(CardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getCardByNumber', async () => {
    (service.getCardByNumber as jest.Mock).mockResolvedValue({ id: '1', cardNumber: '123' });
    const result = await controller.getCardByNumber('123');
    expect(result).toEqual({ id: '1', cardNumber: '123' });
    expect(service.getCardByNumber).toHaveBeenCalledWith('123');
  });

  it('should call transfer and return success', async () => {
    (service.transfer as jest.Mock).mockResolvedValue(undefined);
    const result = await controller.transfer({ senderCardId: '1', receiverCardId: '2', amount: 100, currency: 'UAH' });
    expect(result).toEqual({ success: true });
    expect(service.transfer).toHaveBeenCalledWith('1', '2', 100, 'UAH');
  });

  it('should call transfer and return error', async () => {
    (service.transfer as jest.Mock).mockRejectedValue(new Error('fail'));
    const result = await controller.transfer({ senderCardId: '1', receiverCardId: '2', amount: 100, currency: 'UAH' });
    expect(result).toEqual({ success: false, error: 'fail' });
  });

  it('should call getCardsByUser', async () => {
    (service.findAllByUser as jest.Mock).mockResolvedValue([{ id: '1' }]);
    const result = await controller.getCardsByUser('user-1');
    expect(result).toEqual([{ id: '1' }]);
    expect(service.findAllByUser).toHaveBeenCalledWith('user-1');
  });
}); 