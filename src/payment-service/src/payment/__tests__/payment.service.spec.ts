import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../payment.service';
import { PrismaService } from '../../prisma';
import { of } from 'rxjs';

const mockPrisma = {
  transfer: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockCardClient = {
  send: jest.fn(),
};

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: typeof mockPrisma;
  let cardClient: typeof mockCardClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'CARD_SERVICE', useValue: mockCardClient },
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn(() => of({})) } },
      ],
    }).compile();

    service = module.get(PaymentService);
    prisma = module.get(PrismaService);
    cardClient = module.get('CARD_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('transfer', () => {
    it('successful transfer', async () => {
      cardClient.send
        .mockReturnValueOnce(of({ id: '1', userId: 'u1', cardNumber: '111' })) // senderCard
        .mockReturnValueOnce(of({ id: '2', userId: 'u2', cardNumber: '222' })) // receiverCard
        .mockReturnValueOnce(of({ success: true })); // transfer
      prisma.transfer.create.mockResolvedValue({ id: 't1' });
      const dto = { senderCardNumber: '111', receiverCardNumber: '222', amount: 10, currency: 'UAH' };
      const result = await service.transfer(dto as any, 'u1');
      expect(result).toEqual({ id: 't1' });
      expect(cardClient.send).toHaveBeenCalledTimes(3);
      expect(prisma.transfer.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) }));
    });

    it('throws if card not found', async () => {
      cardClient.send
        .mockReturnValueOnce(of(null)) // senderCard
        .mockReturnValueOnce(of(null)); // receiverCard
      const dto = { senderCardNumber: '111', receiverCardNumber: '222', amount: 10, currency: 'UAH' };
      await expect(service.transfer(dto as any, 'u1')).rejects.toThrow('Card not found');
    });

    it('throws if not your card', async () => {
      cardClient.send
        .mockReturnValueOnce(of({ id: '1', userId: 'u2', cardNumber: '111' })) // senderCard
        .mockReturnValueOnce(of({ id: '2', userId: 'u3', cardNumber: '222' })); // receiverCard
      const dto = { senderCardNumber: '111', receiverCardNumber: '222', amount: 10, currency: 'UAH' };
      await expect(service.transfer(dto as any, 'u1')).rejects.toThrow('Not your card');
    });

    it('failed transfer (result.success === false)', async () => {
      cardClient.send
        .mockReturnValueOnce(of({ id: '1', userId: 'u1', cardNumber: '111' })) // senderCard
        .mockReturnValueOnce(of({ id: '2', userId: 'u2', cardNumber: '222' })) // receiverCard
        .mockReturnValueOnce(of({ success: false, error: 'fail' })); // transfer
      prisma.transfer.create.mockResolvedValue({ id: 't2', status: 'failed', comment: 'fail', completedAt: null });
      const dto = { senderCardNumber: '111', receiverCardNumber: '222', amount: 10, currency: 'UAH' };
      const result = await service.transfer(dto as any, 'u1');
      expect(result).toEqual({ id: 't2', status: 'failed', comment: 'fail', completedAt: null });
      expect(prisma.transfer.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'failed', comment: 'fail', completedAt: null }) }));
    });
  });

  describe('getHistory', () => {
    it('returns outgoing and incoming only successful for receiver', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }, { cardNumber: '222' }]));
      prisma.transfer.findMany.mockResolvedValue([
        { id: 't1', senderCardNumber: '111', receiverCardNumber: '333', status: 'completed' }, // outgoing
        { id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'completed' }, // incoming
        { id: 't3', senderCardNumber: '111', receiverCardNumber: '555', status: 'failed' },    // outgoing (failed)
        { id: 't4', senderCardNumber: '666', receiverCardNumber: '222', status: 'failed' },    // incoming (failed, should not be)
      ]);
      const result = await service.getHistory('u1');
      expect(result).toEqual([
        { id: 't1', senderCardNumber: '111', receiverCardNumber: '333', status: 'completed', type: 'outgoing', cardNumber: '111' },
        { id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'completed', type: 'incoming', cardNumber: '222' },
        { id: 't3', senderCardNumber: '111', receiverCardNumber: '555', status: 'failed', type: 'outgoing', cardNumber: '111' },
      ]);
    });

    it('returns [] if no cards', async () => {
      cardClient.send.mockReturnValueOnce(of([]));
      const result = await service.getHistory('u1');
      expect(result).toEqual([]);
      expect(prisma.transfer.findMany).not.toHaveBeenCalled();
    });

    it('getHistory returns [] if cards = null', async () => {
      cardClient.send.mockReturnValueOnce(of(null));
      const result = await service.getHistory('u1');
      expect(result).toEqual([]);
    });

    it('getHistory returns [] if transfers is empty array', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }]));
      prisma.transfer.findMany.mockResolvedValue([]);
      const result = await service.getHistory('u1');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns outgoing for sender', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }]));
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }]));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't1', senderCardNumber: '111', receiverCardNumber: '333', status: 'completed' });
      const result = await service.getById('t1', 'u1');
      expect(result).toEqual({ id: 't1', senderCardNumber: '111', receiverCardNumber: '333', status: 'completed', type: 'outgoing', cardNumber: '111' });
    });

    it('returns incoming for receiver', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '222' }]));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'completed' });
      const result = await service.getById('t2', 'u1');
      expect(result).toEqual({ id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'completed', type: 'incoming', cardNumber: '222' });
    });

    it('throws if transfer not found', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }]));
      prisma.transfer.findUnique.mockResolvedValue(null);
      await expect(service.getById('t1', 'u1')).rejects.toThrow('Transfer not found');
    });

    it('throws if user has no relation', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '111' }]));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't3', senderCardNumber: '444', receiverCardNumber: '555', status: 'completed' });
      await expect(service.getById('t3', 'u1')).rejects.toThrow('Access denied');
    });

    it('getById throws ForbiddenException if cards is empty array', async () => {
      cardClient.send.mockReturnValueOnce(of([]));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't1', senderCardId: '1', receiverCardId: '2', status: 'completed' });
      await expect(service.getById('t1', 'u1')).rejects.toThrow('Access denied');
    });

    it('getById returns incoming even if status !== completed', async () => {
      cardClient.send.mockReturnValueOnce(of([{ cardNumber: '222' }]));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'failed' });
      const result = await service.getById('t2', 'u1');
      expect(result).toEqual({ id: 't2', senderCardNumber: '444', receiverCardNumber: '222', status: 'failed', type: 'incoming', cardNumber: '222' });
    });

    it('getById throws ForbiddenException if cards = null', async () => {
      cardClient.send.mockReturnValueOnce(of(null));
      prisma.transfer.findUnique.mockResolvedValue({ id: 't1', senderCardNumber: '111', receiverCardNumber: '222', status: 'completed' });
      await expect(service.getById('t1', 'u1')).rejects.toThrow('Cannot read properties of null');
    });
  });

  describe('getHistoryByCard', () => {
    it('returns history for owned card', async () => {
      const card = { id: '1', userId: 'u1', cardNumber: '111' };
      cardClient.send.mockReturnValueOnce(of(card));
      prisma.transfer.findMany.mockResolvedValue([
        { id: 't1', senderCardNumber: '111', receiverCardNumber: '222', status: 'completed' },
        { id: 't2', senderCardNumber: '333', receiverCardNumber: '111', status: 'failed' },
      ]);

      const result = await service.getHistoryByCard('111', 'u1');

      expect(result).toEqual([
        { id: 't1', senderCardNumber: '111', receiverCardNumber: '222', status: 'completed', type: 'outgoing', cardNumber: '111' },
        { id: 't2', senderCardNumber: '333', receiverCardNumber: '111', status: 'failed', type: 'incoming', cardNumber: '111' },
      ]);
    });
  });
}); 