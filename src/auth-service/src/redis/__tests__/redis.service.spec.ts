import { RedisService } from '../../redis';
import { ConfigService } from '@nestjs/config';

const mockPipeline = {
  set: jest.fn().mockReturnThis(),
  sadd: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  srem: jest.fn().mockReturnThis(),
  del: jest.fn().mockReturnThis(),
};

const mockRedis = {
  pipeline: jest.fn(() => mockPipeline),
  get: jest.fn(),
  set: jest.fn(),
  sadd: jest.fn(),
  expire: jest.fn(),
  smembers: jest.fn(),
  srem: jest.fn(),
  del: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedis),
  };
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = { get: jest.fn().mockReturnValue('redis://localhost:6379') };
    service = new RedisService(configService);
    service.onModuleInit();
  });

  it('should set session', async () => {
    mockPipeline.exec.mockResolvedValue([]);
    const data = { userId: 'u1', role: 'user' };
    const result = await service.setSession('s1', data, 100);
    expect(result).toBe(true);
    expect(mockPipeline.set).toHaveBeenCalled();
    expect(mockPipeline.sadd).toHaveBeenCalled();
    expect(mockPipeline.expire).toHaveBeenCalled();
    expect(mockPipeline.exec).toHaveBeenCalled();
  });

  it('should get session', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ userId: 'u1', role: 'user' }));
    const result = await service.getSession('s1');
    expect(result).toEqual({ userId: 'u1', role: 'user' });
    expect(mockRedis.get).toHaveBeenCalled();
  });

  it('should return null if session not found', async () => {
    mockRedis.get.mockResolvedValue(null);
    const result = await service.getSession('s1');
    expect(result).toBeNull();
  });

  it('should get sessions by userId', async () => {
    mockRedis.smembers.mockResolvedValue(['s1', 's2']);
    const result = await service.getSessionsByUserId('u1');
    expect(result).toEqual(['s1', 's2']);
    expect(mockRedis.smembers).toHaveBeenCalled();
  });

  it('should delete session and remove from user set', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ userId: 'u1' }));
    mockPipeline.exec.mockResolvedValue([]);
    await service.deleteSession('s1');
    expect(mockPipeline.srem).toHaveBeenCalledWith('user-session:u1', 's1');
    expect(mockPipeline.del).toHaveBeenCalledWith('session:s1');
    expect(mockPipeline.exec).toHaveBeenCalled();
  });

  it('should delete session even if not found', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockPipeline.exec.mockResolvedValue([]);
    await service.deleteSession('s1');
    expect(mockPipeline.del).toHaveBeenCalledWith('session:s1');
    expect(mockPipeline.exec).toHaveBeenCalled();
  });

  it('should delete all user sessions', async () => {
    jest.spyOn(service, 'getSessionsByUserId').mockResolvedValue(['s1', 's2']);
    mockPipeline.exec.mockResolvedValue([]);
    await service.deleteAllUserSessions('u1');
    expect(mockPipeline.del).toHaveBeenCalledWith('session:s1');
    expect(mockPipeline.del).toHaveBeenCalledWith('session:s2');
    expect(mockPipeline.del).toHaveBeenCalledWith('user-session:u1');
    expect(mockPipeline.exec).toHaveBeenCalled();
  });

  it('should disconnect on module destroy', () => {
    service.onModuleDestroy();
    expect(mockRedis.disconnect).toHaveBeenCalled();
  });
});