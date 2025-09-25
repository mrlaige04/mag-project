import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../user';
import { PrismaService } from '../../prisma';
import { RpcException } from '@nestjs/microservices';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: any;
  let prisma: any;
  let authClient: any;

  beforeEach(async () => {
    const prismaMockedService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };
    authClient = { send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMockedService },
        { provide: 'AUTH_SERVICE', useValue: authClient },
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn(() => of({})) } },
      ],
    }).compile();

    service = module.get<UserService>(UserService) as any;
    prisma = module.get<PrismaService>(PrismaService) as any;
  });

  it('should create user if not exists', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1' });
    const result = await service.create({ email: 'a', phone: 'b', dateOfBirth: '2000-01-01' });
    expect(result).toEqual({ id: '1' });
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('should throw if user exists', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: '1' });
    await expect(service.create({ email: 'a', phone: 'b' })).rejects.toThrow(RpcException);
  });

  it('should convert dateOfBirth to Date', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: '1', dateOfBirth: new Date('2000-01-01') });
    const result = await service.create({ email: 'a', phone: 'b', dateOfBirth: '2000-01-01' });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dateOfBirth: expect.any(Date) }),
      }),
    );
    expect(result).toHaveProperty('id', '1');
  });

  it('should delete user', async () => {
    prisma.user.delete.mockResolvedValue({ id: '1' });
    const result = await service.delete('1');
    expect(result).toEqual({ id: '1' });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should update password', async () => {
    prisma.user.update.mockResolvedValue({ id: '1', passwordHash: 'hash' });
    const result = await service.updatePassword('1', 'hash');
    expect(result).toEqual({ id: '1', passwordHash: 'hash' });
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { passwordHash: 'hash' } });
  });

  it('should update profile', async () => {
    prisma.user.update.mockResolvedValue({ id: '1', email: 'a' });
    const dto = { email: 'a' };
    const result = await service.updateProfile('1', dto);
    expect(result).toEqual({ id: '1', email: 'a' });
  });

  it('should throw if phone already exists in updateProfile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '2' });
    const dto = { phone: 'b' };
    await expect(service.updateProfile('1', dto)).rejects.toThrow(ConflictException);
  });

  it('should throw if no data to update in updateProfile', async () => {
    await expect(service.updateProfile('1', {})).rejects.toThrow(BadRequestException);
  });

  it('should enable 2FA', async () => {
    prisma.user.update.mockResolvedValue({ id: '1', twoFactorEnabled: true });
    const result = await service.enable2FA('1');
    expect(result).toEqual({ id: '1', twoFactorEnabled: true });
  });

  it('should disable 2FA', async () => {
    prisma.user.update.mockResolvedValue({ id: '1', twoFactorEnabled: false });
    const result = await service.disable2FA('1');
    expect(result).toEqual({ id: '1', twoFactorEnabled: false });
  });

  it('should update user status', async () => {
    prisma.user.update.mockResolvedValue({ id: '1', status: 'active' });
    const result = await service.updateUserStatus('1', 'active');
    expect(result).toEqual({ id: '1', status: 'active' });
  });

  it('should find user by id', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1' });
    const result = await service.findById('1');
    expect(result).toEqual({ id: '1' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should find user by email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'a' });
    const result = await service.findByEmail('a');
    expect(result).toEqual({ id: '1', email: 'a' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a' } });
  });

  it('should find user by phone', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: '1', phone: 'b' });
    const result = await service.findByPhone('b');
    expect(result).toEqual({ id: '1', phone: 'b' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { phone: 'b' } });
  });
});