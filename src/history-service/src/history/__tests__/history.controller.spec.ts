import { Test, TestingModule } from '@nestjs/testing';
import { HistoryController } from '../history.controller';
import { HistoryService } from '../history.service';
import { SessionGuard, VerificationGuard, AdminRoleGuard } from '../../../common/guards';

describe('HistoryController', () => {
  let controller: HistoryController;
  let service: any;

  beforeEach(async () => {
    const mockHistoryService = {
      getUserEvents: jest.fn(),
      getAllEvents: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryController],
      providers: [
        { provide: HistoryService, useValue: mockHistoryService },
        { provide: SessionGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: VerificationGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: AdminRoleGuard, useValue: { canActivate: jest.fn().mockReturnValue(true) } },
        { provide: 'AUTH_SERVICE', useValue: { send: jest.fn() } },
        { provide: 'VERIFICATION_SERVICE', useValue: { send: jest.fn() } },
      ],
    }).compile();
    controller = module.get<HistoryController>(HistoryController);
    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUserEvents повертає події користувача', async () => {
    service.getUserEvents.mockResolvedValue([{ id: 'e1' }]);
    const result = await controller.getUserEvents('u1');
    expect(result).toEqual([{ id: 'e1' }]);
    expect(service.getUserEvents).toHaveBeenCalledWith('u1');
  });

  it('getAllEvents повертає всі події', async () => {
    service.getAllEvents.mockResolvedValue([{ id: 'e2' }]);
    const result = await controller.getAllEvents();
    expect(result).toEqual([{ id: 'e2' }]);
    expect(service.getAllEvents).toHaveBeenCalled();
  });
}); 