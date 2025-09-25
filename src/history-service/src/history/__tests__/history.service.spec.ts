import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from '../history.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryService, PrismaService],
    }).compile();
    service = module.get(HistoryService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('logEvent створює подію', async () => {
    const createMock = jest.spyOn(prisma.event, 'create').mockResolvedValue({ id: 'e1' } as any);
    const dto = { userId: 'u1', eventType: 'LOGIN' as const, meta: { ip: '1.1.1.1' } };
    const result = await service.logEvent(dto);
    expect(result).toEqual({ id: 'e1' });
    expect(createMock).toHaveBeenCalledWith({ data: dto });
  });

  it('getUserEvents повертає події користувача', async () => {
    const findManyMock = jest.spyOn(prisma.event, 'findMany').mockResolvedValue([{ id: 'e1' }] as any);
    const result = await service.getUserEvents('u1');
    expect(result).toEqual([{ id: 'e1' }]);
    expect(findManyMock).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { timestamp: 'desc' } });
  });

  it('getAllEvents повертає всі події', async () => {
    const findManyMock = jest.spyOn(prisma.event, 'findMany').mockResolvedValue([{ id: 'e2' }] as any);
    const result = await service.getAllEvents();
    expect(result).toEqual([{ id: 'e2' }]);
    expect(findManyMock).toHaveBeenCalledWith({ orderBy: { timestamp: 'desc' } });
  });
}); 