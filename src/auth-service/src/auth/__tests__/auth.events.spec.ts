import { AuthEventsController } from '../../auth';
import { RedisService } from '../../redis';

describe('AuthEventsController', () => {
  let controller: AuthEventsController;
  let redisService: any;

  beforeEach(() => {
    redisService = { getSession: jest.fn() };
    controller = new AuthEventsController(redisService);
  });

  it('should return valid: true and session if session exists', async () => {
    const session = { userId: '1', role: 'user' };
    redisService.getSession.mockResolvedValue(session);
    const result = await controller.validateSession('sessionId');
    expect(result).toEqual({ valid: true, ...session });
    expect(redisService.getSession).toHaveBeenCalledWith('sessionId');
  });

  it('should return valid: false if session does not exist', async () => {
    redisService.getSession.mockResolvedValue(null);
    const result = await controller.validateSession('badSession');
    expect(result).toEqual({ valid: false });
    expect(redisService.getSession).toHaveBeenCalledWith('badSession');
  });
}); 