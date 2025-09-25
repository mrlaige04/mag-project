import { Test, TestingModule } from '@nestjs/testing';
import { HistoryEventsController } from '../history.events';
import { HistoryService } from '../history.service';

describe('HistoryEventsController', () => {
  let controller: HistoryEventsController;
  let service: any;

  beforeEach(async () => {
    const mockHistoryService = {
      logEvent: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoryEventsController],
      providers: [
        { provide: HistoryService, useValue: mockHistoryService },
      ],
    }).compile();
    controller = module.get<HistoryEventsController>(HistoryEventsController);
    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('logEvent викликає HistoryService.logEvent', async () => {
    service.logEvent.mockResolvedValue({ id: 'e1' });
    const dto = { userId: 'u1', eventType: 'LOGIN' as const, meta: { ip: '1.1.1.1' } };
    const result = await controller.logEvent(dto);
    expect(result).toEqual({ id: 'e1' });
    expect(service.logEvent).toHaveBeenCalledWith(dto);
  });
}); 