import { Test, TestingModule } from '@nestjs/testing';
import { CardController } from '../card.controller';
import { CardService } from '../card.service';
import { SessionGuard, CardOwnerGuard, AdminRoleGuard, VerificationGuard } from '../../../common/guards';
import { PrismaService } from '../../prisma';

describe('CardController', () => {
  let controller: CardController;
  let service: any;

  beforeEach(async () => {
    const mockCardService = {
      createCardApplication: jest.fn(),
      blockCard: jest.fn(),
      unblockCard: jest.fn(),
      closeCard: jest.fn(),
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      getAllApplications: jest.fn(),
      approveApplication: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardController],
      providers: [
        { provide: CardService, useValue: mockCardService },
        { provide: SessionGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: CardOwnerGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: AdminRoleGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: VerificationGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: 'AUTH_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'VERIFICATION_SERVICE', useValue: { send: jest.fn() } },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CardController>(CardController);
    service = module.get<CardService>(CardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call createCardApplication', async () => {
    service.createCardApplication.mockResolvedValue({ id: '1' });
    const req = { user: { userId: 'u1' } };
    const dto = { cardType: 'debit', provider: 'visa' };
    const result = await controller.openCard(dto as any, req as any);
    expect(result).toEqual({ id: '1' });
    expect(service.createCardApplication).toHaveBeenCalledWith('u1', dto);
  });

  it('should call blockCard', async () => {
    service.blockCard.mockResolvedValue({ id: '1', status: 'blocked' });
    const result = await controller.blockCard('1');
    expect(result).toEqual({ id: '1', status: 'blocked' });
    expect(service.blockCard).toHaveBeenCalledWith('1');
  });

  it('should call unblockCard', async () => {
    service.unblockCard.mockResolvedValue({ id: '1', status: 'active' });
    const result = await controller.unblockCard('1');
    expect(result).toEqual({ id: '1', status: 'active' });
    expect(service.unblockCard).toHaveBeenCalledWith('1');
  });

  it('should call closeCard', async () => {
    service.closeCard.mockResolvedValue({ id: '1', status: 'closed' });
    const result = await controller.closeCard('1');
    expect(result).toEqual({ id: '1', status: 'closed' });
    expect(service.closeCard).toHaveBeenCalledWith('1');
  });

  it('should call getAllByUser', async () => {
    service.findAllByUser.mockResolvedValue([{ id: '1' }]);
    const req = { user: { userId: 'u1' } };
    const result = await controller.getAllByUser(req as any);
    expect(result).toEqual([{ id: '1' }]);
    expect(service.findAllByUser).toHaveBeenCalledWith('u1');
  });

  it('should call getApplications', async () => {
    service.getAllApplications.mockResolvedValue([{ id: '1' }]);
    const result = await controller.getApplications();
    expect(result).toEqual([{ id: '1' }]);
    expect(service.getAllApplications).toHaveBeenCalled();
  });

  it('should call approveApplication', async () => {
    service.approveApplication.mockResolvedValue({ id: '1' });
    const result = await controller.approveApplication('1');
    expect(result).toEqual({ id: '1' });
    expect(service.approveApplication).toHaveBeenCalledWith('1');
  });

  it('should call getOne', async () => {
    service.findOne.mockResolvedValue({ id: '1' });
    const result = await controller.getOne('1');
    expect(result).toEqual({ id: '1' });
    expect(service.findOne).toHaveBeenCalledWith('1');
  });
}); 