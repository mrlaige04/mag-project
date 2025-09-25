import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, AuthController } from '../../auth';
import { SessionGuard } from '../../../common/guards';
import { RedisService } from '../../redis';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;
  let mockRes: any;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      setup2fa: jest.fn(),
      enable2fa: jest.fn(),
      verify2fa: jest.fn(),
      disable2fa: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      logout: jest.fn(),
      logoutAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: mockAuthService },
        ],
      })
        .overrideGuard(SessionGuard)
        .useValue({ canActivate: jest.fn().mockReturnValue(true) })
        .overrideProvider(RedisService)
        .useValue({})
        .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService) as any;
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register', async () => {
    (service.register as any).mockResolvedValue({ id: '1' });
    const result = await controller.register({
        email: 'a',
        phone: 'b',
        password: 'c',
        fullName: 'Test User',
        dateOfBirth: new Date().toISOString(),
      });
    expect(result).toEqual({ id: '1' });
    expect(service.register).toHaveBeenCalled();
  });

  it('should call login', async () => {
    (service.login as any).mockResolvedValue({ sessionId: 'abc' });
    const result = await controller.login({ phone: 'b', password: 'c' }, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.login).toHaveBeenCalled();
  });

  it('should call setup2fa', async () => {
    (service.setup2fa as any).mockResolvedValue({ otpauth_url: 'url' });
    const mockReq = { user: { id: '1' } } as any;
    const result = await controller.setup2fa(mockReq);
    expect(result).toEqual({ otpauth_url: 'url' });
    expect(service.setup2fa).toHaveBeenCalled();
  });

  it('should call enable2fa', async () => {
    (service.enable2fa as any).mockResolvedValue({ success: true });
    const mockReq = { user: { id: '1' } } as any;
    const dto = { code: '123' };
    const result = await controller.enable2fa(mockReq, dto);
    expect(result).toEqual({ success: true });
    expect(service.enable2fa).toHaveBeenCalled();
  });

  it('should call verify2fa', async () => {
    (service.verify2fa as any).mockResolvedValue({ sessionId: 'abc' });
    const mockReq = { user: { id: '1' } } as any;
    const result = await controller.verify2fa(mockReq, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.verify2fa).toHaveBeenCalled();
  });

  it('should call disable2fa', async () => {
    (service.disable2fa as any).mockResolvedValue({ success: true });
    const mockReq = { user: { id: '1' } } as any;
    const result = await controller.disable2fa(mockReq);
    expect(result).toEqual({ success: true });
    expect(service.disable2fa).toHaveBeenCalled();
  });

  it('should call requestPasswordReset', async () => {
    (service.requestPasswordReset as any).mockResolvedValue({ token: 't' });
    const result = await controller.requestPasswordReset({ email: 'a' });
    expect(result).toEqual({ token: 't' });
    expect(service.requestPasswordReset).toHaveBeenCalled();
  });

  it('should call resetPassword', async () => {
    (service.resetPassword as any).mockResolvedValue({ success: true });
    const result = await controller.resetPassword({ token: 't', newPassword: 'p' });
    expect(result).toEqual({ success: true });
    expect(service.resetPassword).toHaveBeenCalled();
  });

  it('should call logout', async () => {
    (service.logout as any).mockResolvedValue({ success: true });
    const mockReq = { body: { sessionId: 's' } } as any;
    const result = await controller.logout(mockReq, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.logout).toHaveBeenCalled();
  });

  it('should call logout_all', async () => {
    (service.logoutAll as any).mockResolvedValue({ success: true });
    const mockReq = { user: { userId: '1' } } as any;
    const result = await controller.logout_all(mockReq, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.logoutAll).toHaveBeenCalled();
  });

  it('should return require2fa if needed (login)', async () => {
    (service.login as any).mockResolvedValue({ require2fa: true });
    const result = await controller.login({ phone: 'b', password: 'c' }, mockRes);
    expect(result).toEqual({ require2fa: true });
    expect(mockRes.cookie).not.toHaveBeenCalled();
  });

  it('should call verify2fa and set cookie', async () => {
    (service.verify2fa as any).mockResolvedValue({ sessionId: 'abc' });
    const body = { userId: '1', code: '123' };
    const result = await controller.verify2fa(body, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.verify2fa).toHaveBeenCalledWith('1', '123');
    expect(mockRes.cookie).toHaveBeenCalledWith('sessionId', 'abc', expect.any(Object));
  });

  it('should handle logout with no sessionId', async () => {
    (service.logout as any).mockResolvedValue({ success: true });
    const mockReq = { cookies: {} } as any;
    const result = await controller.logout(mockReq, mockRes);
    expect(result).toEqual({ success: true, sessionIdEnded: undefined });
    expect(service.logout).toHaveBeenCalledWith(undefined);
    expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId');
  });

  it('should call logoutAll and clear cookie', async () => {
    (service.logoutAll as any).mockResolvedValue({ success: true });
    const mockReq = { user: { userId: '1' } } as any;
    const result = await controller.logout_all(mockReq, mockRes);
    expect(result).toEqual({ success: true });
    expect(service.logoutAll).toHaveBeenCalledWith('1');
    expect(mockRes.clearCookie).toHaveBeenCalledWith('sessionId');
  });

  it('should handle enable2fa with no userId', async () => {
    (service.enable2fa as any).mockResolvedValue({ success: false });
    const mockReq = { user: {} } as any;
    const dto = { code: '123' };
    const result = await controller.enable2fa(mockReq, dto);
    expect(result).toEqual({ success: false });
    expect(service.enable2fa).toHaveBeenCalledWith(undefined, '123');
  });

  it('should handle disable2fa with no userId', async () => {
    (service.disable2fa as any).mockResolvedValue({ success: false });
    const mockReq = { user: {} } as any;
    const result = await controller.disable2fa(mockReq);
    expect(result).toEqual({ success: false });
    expect(service.disable2fa).toHaveBeenCalledWith(undefined);
  });

  it('should handle setup2fa with no userId', async () => {
    (service.setup2fa as any).mockResolvedValue({ otpauth_url: null });
    const mockReq = { user: {} } as any;
    const result = await controller.setup2fa(mockReq);
    expect(result).toEqual({ otpauth_url: null });
    expect(service.setup2fa).toHaveBeenCalledWith(undefined);
  });

  it('should throw if requestPasswordReset fails', async () => {
    (service.requestPasswordReset as any).mockRejectedValue(new Error('fail'));
    await expect(controller.requestPasswordReset({ email: 'a' })).rejects.toThrow('fail');
  });

  it('should throw if resetPassword fails', async () => {
    (service.resetPassword as any).mockRejectedValue(new Error('fail'));
    await expect(controller.resetPassword({ token: 't', newPassword: 'p' })).rejects.toThrow('fail');
  });
});