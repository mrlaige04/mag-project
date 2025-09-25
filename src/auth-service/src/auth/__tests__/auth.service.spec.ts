import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../auth';
import { RedisService } from '../../redis';
import { PrismaService } from '../../prisma';
import * as bcrypt from 'bcryptjs';
import { of } from 'rxjs';
import * as speakeasy from 'speakeasy';

describe('AuthService', () => {
  let service: any;
  let redisService: any;
  let prisma: any;
  let userClient: any;

  beforeEach(async () => {
    redisService = { setSession: jest.fn(), getSession: jest.fn(), deleteSession: jest.fn(), getSessionsByUserId: jest.fn(), deleteAllUserSessions: jest.fn() };
    prisma = {
      twoFactorSecret: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    userClient = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RedisService, useValue: redisService },
        { provide: PrismaService, useValue: prisma },
        { provide: 'USER_SERVICE', useValue: userClient },
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn(() => of({})) } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService) as any;
    redisService = module.get<RedisService>(RedisService) as any;
    prisma = module.get<PrismaService>(PrismaService) as any;
    userClient = module.get('USER_SERVICE') as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
  it('should register user', async () => {
    const dto = {
      email: 'test@email.com',
      phone: '+380991112233',
      password: 'securePass',
      fullName: 'Test User',
      dateOfBirth: '2000-01-01',
    };
    (userClient.send as any).mockReturnValue(of({ id: '42' }));
    const result = await service.register(dto);
    expect(result).toEqual({ id: '42' });
    expect(userClient.send).toHaveBeenCalledWith(
        { cmd: 'create-user' },
        expect.objectContaining({
          email: dto.email,
          phone: dto.phone,
          fullName: dto.fullName,
          dateOfBirth: dto.dateOfBirth,
          passwordHash: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          status: 'unverified',
          role: 'user',
        })
      );
  });

  it('should throw if required fields are missing', async () => {
    const dto = {
      email: 'test@email.com',
      password: 'securePass',
      fullName: 'Test User',
    } as any;
    await expect(service.register(dto)).rejects.toThrow();
  });

  it('should throw if user not found on login', async () => {
    (userClient.send as any).mockReturnValue(of(null));
    await expect(service.login({ phone: '123', password: 'pass' })).rejects.toThrow();
  });

  it('should return sessionId on successful login', async () => {
    const passwordHash = await bcrypt.hash('pass', 10);
    (userClient.send as any).mockReturnValue(of({ id: '1', passwordHash, role: 'user' }));
    (bcrypt.compare as any) = jest.fn().mockResolvedValue(true);
    (redisService.setSession as any) = jest.fn().mockResolvedValue(true);

    const result = await service.login({ phone: '123', password: 'pass' });
    expect(result).toHaveProperty('sessionId');
  });

  it('should setup 2fa', async () => {
    (prisma.twoFactorSecret.deleteMany as any).mockResolvedValue(true);
    (prisma.twoFactorSecret.create as any).mockResolvedValue({ secret: 'secret' });
    const result = await service.setup2fa('userId');
    expect(result).toHaveProperty('otpauth_url');
  });

  it('should throw on invalid 2fa code', async () => {
    (prisma.twoFactorSecret.findFirst as any).mockResolvedValue({ secret: 'secret', id: 'id' });
    await expect(service.enable2fa('userId', 'wrong')).rejects.toThrow();
  });

  // verify2fa
  it('should throw if 2fa not enabled in verify2fa', async () => {
    prisma.twoFactorSecret.findFirst.mockResolvedValue(null);
    await expect(service.verify2fa('userId', 'code')).rejects.toThrow();
  });

  it('should throw if 2fa code invalid in verify2fa', async () => {
    prisma.twoFactorSecret.findFirst.mockResolvedValue({ secret: 'secret', enabled: true });
    jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);
    await expect(service.verify2fa('userId', 'wrong')).rejects.toThrow();
  });

  it('should return sessionId on valid verify2fa', async () => {
    prisma.twoFactorSecret.findFirst.mockResolvedValue({ secret: 'secret', enabled: true });
    jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
    (userClient.send as any).mockReturnValue(of({ id: 'userId', role: 'user' }));
    redisService.setSession.mockResolvedValue(true);
    const result = await service.verify2fa('userId', '123456');
    expect(result).toHaveProperty('sessionId');
  });

  // disable2fa
  it('should throw if 2fa not enabled in disable2fa', async () => {
    prisma.twoFactorSecret.findFirst.mockResolvedValue(null);
    await expect(service.disable2fa('userId')).rejects.toThrow();
  });

  it('should disable 2fa', async () => {
    prisma.twoFactorSecret.findFirst.mockResolvedValue({ id: 'id', enabled: true });
    prisma.twoFactorSecret.deleteMany.mockResolvedValue(true);
    (userClient.send as any).mockReturnValue(of(true));
    const result = await service.disable2fa('userId');
    expect(result).toHaveProperty('success', true);
  });

  // requestPasswordReset
  it('should throw if user not found in requestPasswordReset', async () => {
    (userClient.send as any).mockReturnValue(of(null));
    await expect(service.requestPasswordReset('email')).rejects.toThrow();
  });

  it('should create password reset token', async () => {
    (userClient.send as any).mockReturnValue(of({ id: 'userId' }));
    (prisma.passwordResetToken.create as any).mockResolvedValue({ token: 'token', expiresAt: new Date() });
    const result = await service.requestPasswordReset('email');
    expect(result).toHaveProperty('token');
  });

  // resetPassword
  it('should throw if token not found or expired in resetPassword', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);
    await expect(service.resetPassword('token', 'newPass')).rejects.toThrow();
  });

  it('should reset password and delete token', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({ token: 'token', used: false, expiresAt: new Date(Date.now() + 10000), userId: 'userId' });
    (userClient.send as any).mockReturnValue(of(true));
    (prisma.passwordResetToken.delete as any).mockResolvedValue(true);
    const result = await service.resetPassword('token', 'newPass');
    expect(result).toHaveProperty('success', true);
  });

  // logout
  it('should throw if no sessionId in logout', async () => {
    await expect(service.logout(undefined)).rejects.toThrow();
  });

  it('should logout', async () => {
    redisService.deleteSession.mockResolvedValue(true);
    redisService.getSession.mockResolvedValue({ userId: 'u1', role: 'user' });
    const result = await service.logout('sessionId');
    expect(result).toHaveProperty('success', true);
  });

  // logoutAll
  it('should logout all sessions', async () => {
    redisService.getSessionsByUserId.mockResolvedValue(['s1', 's2']);
    redisService.deleteAllUserSessions.mockResolvedValue(true);
    const result = await service.logoutAll('userId');
    expect(result).toHaveProperty('success', true);
  });

  it('should return message if no sessions found in logoutAll', async () => {
    redisService.getSessionsByUserId.mockResolvedValue([]);
    const result = await service.logoutAll('userId');
    expect(result).toHaveProperty('message');
  });
}); 