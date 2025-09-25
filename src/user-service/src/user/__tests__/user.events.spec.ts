import { Test, TestingModule } from '@nestjs/testing';
import { UserEventsController, UserService } from '../../user';

describe('UserEventsController', () => {
  let controller: UserEventsController;
  let userService: any;

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      updatePassword: jest.fn(),
      enable2FA: jest.fn(),
      disable2FA: jest.fn(),
      updateUserStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserEventsController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserEventsController>(UserEventsController);
  });

  it('should call createUser', async () => {
    userService.create.mockResolvedValue({ id: '1' });
    const result = await controller.createUser({ email: 'a', phone: 'b' });
    expect(result).toEqual({ id: '1' });
    expect(userService.create).toHaveBeenCalled();
  });

  it('should call findUser by id', async () => {
    userService.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findUser({ id: '1' });
    expect(result).toEqual({ id: '1' });
    expect(userService.findById).toHaveBeenCalledWith('1');
  });

  it('should call findUser by email', async () => {
    userService.findByEmail.mockResolvedValue({ id: '2' });
    const result = await controller.findUser({ email: 'a' });
    expect(result).toEqual({ id: '2' });
    expect(userService.findByEmail).toHaveBeenCalledWith('a');
  });

  it('should call findUser by phone', async () => {
    userService.findByPhone.mockResolvedValue({ id: '3' });
    const result = await controller.findUser({ phone: 'b' });
    expect(result).toEqual({ id: '3' });
    expect(userService.findByPhone).toHaveBeenCalledWith('b');
  });

  it('should return null if no params in findUser', async () => {
    const result = await controller.findUser({});
    expect(result).toBeNull();
  });

  it('should call updateUserPassword', async () => {
    userService.updatePassword.mockResolvedValue({ id: '1' });
    const result = await controller.updateUserPassword({ userId: '1', passwordHash: 'hash' });
    expect(result).toEqual({ id: '1' });
    expect(userService.updatePassword).toHaveBeenCalledWith('1', 'hash');
  });

  it('should call enable2FA', async () => {
    userService.enable2FA.mockResolvedValue({ id: '1', twoFactorEnabled: true });
    const result = await controller.enable2FA({ userId: '1' });
    expect(result).toEqual({ id: '1', twoFactorEnabled: true });
    expect(userService.enable2FA).toHaveBeenCalledWith('1');
  });

  it('should call disable2FA', async () => {
    userService.disable2FA.mockResolvedValue({ id: '1', twoFactorEnabled: false });
    const result = await controller.disable2FA({ userId: '1' });
    expect(result).toEqual({ id: '1', twoFactorEnabled: false });
    expect(userService.disable2FA).toHaveBeenCalledWith('1');
  });

  it('should call updateUserStatus', async () => {
    userService.updateUserStatus.mockResolvedValue({ id: '1', status: 'active' });
    const result = await controller.updateUserStatus({ userId: '1', status: 'active' });
    expect(result).toEqual({ id: '1', status: 'active' });
    expect(userService.updateUserStatus).toHaveBeenCalledWith('1', 'active');
  });
});