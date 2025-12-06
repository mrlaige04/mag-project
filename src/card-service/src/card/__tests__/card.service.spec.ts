import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from '../card.service';
import { PrismaService } from '../../prisma';
import * as bcrypt from 'bcryptjs';
import { of } from 'rxjs';

describe('CardService', () => {
  let service: CardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      card: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      cardApplication: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn(() => of({})) } },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create card immediately (no application)', async () => {
    const dto = { cardType: 'debit', provider: 'visa' };
    const mockCard = { id: '1', userId: 'u1', cardType: 'debit', provider: 'visa', status: 'active', cardNumber: '123', cvvHash: 'hash' };
    jest.spyOn<any, any>(service as any, 'openCard').mockResolvedValue(mockCard);
    const result = await service.createCardApplication('u1', dto as any);
    expect(result).toEqual(mockCard);
    expect(service['openCard']).toHaveBeenCalledWith('u1', dto);
  });

  it('should find all cards by user', async () => {
    prisma.card.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAllByUser('u1');
    expect(result).toEqual([{ id: '1' }]);
    expect(prisma.card.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });

  it('should get card by number', async () => {
    prisma.card.findUnique.mockResolvedValue({ id: '1', cardNumber: '123' });
    const result = await service.getCardByNumber('123');
    expect(result).toEqual({ id: '1', cardNumber: '123' });
    expect(prisma.card.findUnique).toHaveBeenCalledWith({ where: { cardNumber: '123' } });
  });

  it('should block card', async () => {
    prisma.card.update.mockResolvedValue({ id: '1', status: 'blocked' });
    const result = await service.blockCard('1');
    expect(result).toEqual({ id: '1', status: 'blocked' });
    expect(prisma.card.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { status: 'blocked' } });
  });

  it('should unblock card', async () => {
    prisma.card.update.mockResolvedValue({ id: '1', status: 'active' });
    const result = await service.unblockCard('1');
    expect(result).toEqual({ id: '1', status: 'active' });
    expect(prisma.card.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { status: 'active' } });
  });

  it('should close card if balance is zero', async () => {
    prisma.card.findUnique.mockResolvedValue({ id: '1', balance: 0 });
    prisma.card.update.mockResolvedValue({ id: '1', status: 'closed' });
    const result = await service.closeCard('1');
    expect(result).toEqual({ id: '1', status: 'closed' });
  });

  it('should throw if card not found on close', async () => {
    prisma.card.findUnique.mockResolvedValue(null);
    await expect(service.closeCard('1')).rejects.toThrow('Card not found');
  });

  it('should throw if card balance not zero on close', async () => {
    prisma.card.findUnique.mockResolvedValue({ id: '1', balance: 100 });
    await expect(service.closeCard('1')).rejects.toThrow('Cannot close card with non-zero balance');
  });

  it('should get one card', async () => {
    prisma.card.findUnique.mockResolvedValue({ id: '1' });
    const result = await service.findOne('1');
    expect(result).toEqual({ id: '1' });
    expect(prisma.card.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should get all applications', async () => {
    prisma.cardApplication.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.getAllApplications();
    expect(result).toEqual([{ id: '1' }]);
    expect(prisma.cardApplication.findMany).toHaveBeenCalled();
  });

  describe('transfer', () => {
    let tx: any;
    beforeEach(() => {
      tx = {
        card: {
          update: jest.fn(),
        },
        $queryRawUnsafe: jest.fn(),
      };
      prisma.$transaction = jest.fn((cb) => cb(tx));
    });

    it('should throw if sender or receiver not found', async () => {
      tx.$queryRawUnsafe.mockResolvedValueOnce([]);
      await expect(service.transfer('s', 'r', 100, 'UAH')).rejects.toThrow('Card not found');
    });

    it('should throw if currency mismatch', async () => {
      tx.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 's', currency: 'UAH', balance: 200 }])
        .mockResolvedValueOnce([{ id: 'r', currency: 'USD', balance: 0 }]);
      await expect(service.transfer('s', 'r', 100, 'UAH')).rejects.toThrow('Currency mismatch');
    });

    it('should throw if insufficient funds', async () => {
      tx.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 's', currency: 'UAH', balance: 50 }])
        .mockResolvedValueOnce([{ id: 'r', currency: 'UAH', balance: 0 }]);
      await expect(service.transfer('s', 'r', 100, 'UAH')).rejects.toThrow('Insufficient funds');
    });

    it('should transfer funds successfully', async () => {
      tx.$queryRawUnsafe
        .mockResolvedValueOnce([{ id: 's', currency: 'UAH', balance: 200 }])
        .mockResolvedValueOnce([{ id: 'r', currency: 'UAH', balance: 0 }]);
      tx.card.update.mockResolvedValue({});
      await expect(service.transfer('s', 'r', 100, 'UAH')).resolves.toBeUndefined();
      expect(tx.card.update).toHaveBeenCalledWith({ where: { id: 's' }, data: { balance: { decrement: 100 } } });
      expect(tx.card.update).toHaveBeenCalledWith({ where: { id: 'r' }, data: { balance: { increment: 100 } } });
    });
  });
}); 