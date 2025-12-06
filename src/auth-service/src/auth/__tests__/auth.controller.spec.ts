import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, AuthController } from '../../auth';
import { JwtGuard } from '@app/common';
import { RedisService } from '../../redis';

describe('AuthController', () => {
  let controller: AuthController;
  let service: any;

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
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideProvider(RedisService)
      .useValue({})
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService) as any;
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
    (service.login as any).mockResolvedValue({
      accessToken: 'jwt',
      accessTokenExpiresAt: new Date(),
      refreshToken: 'rjwt',
      refreshTokenExpiresAt: new Date(),
    });
    const dto = { phone: 'b', password: 'c' } as any;
    const result = await controller.login(dto);
    expect(result).toEqual({
      accessToken: 'jwt',
      accessTokenExpiresAt: expect.any(Date),
      refreshToken: 'rjwt',
      refreshTokenExpiresAt: expect.any(Date),
    });
    expect(service.login).toHaveBeenCalledWith(dto);
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
    (service.verify2fa as any).mockResolvedValue({
      accessToken: 'jwt',
      accessTokenExpiresAt: new Date(),
      refreshToken: 'rjwt',
      refreshTokenExpiresAt: new Date(),
    });
    const body = { userId: '1', code: '123' };
    const result = await controller.verify2fa(body);
    expect(result).toEqual({
      accessToken: 'jwt',
      accessTokenExpiresAt: expect.any(Date),
      refreshToken: 'rjwt',
      refreshTokenExpiresAt: expect.any(Date),
    });
    expect(service.verify2fa).toHaveBeenCalledWith('1', '123');
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
    const mockReq = { user: { userId: '1' } } as any;
    const result = await controller.logout(mockReq);
    expect(result).toEqual({ success: true });
    expect(service.logout).toHaveBeenCalledWith('1');
  });

  it('should call logoutAll', async () => {
    (service.logoutAll as any).mockResolvedValue({ success: true });
    const mockReq = { user: { userId: '1' } } as any;
    const result = await controller.logoutAll(mockReq);
    expect(result).toEqual({ success: true });
    expect(service.logoutAll).toHaveBeenCalledWith('1');
  });

  it('should return require2fa if needed (login)', async () => {
    (service.login as any).mockResolvedValue({ require2fa: true, userId: '1' });
    const dto = { phone: 'b', password: 'c' } as any;
    const result = await controller.login(dto);
    expect(result).toEqual({ require2fa: true, userId: '1' });
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