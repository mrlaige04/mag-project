import { Test, TestingModule } from '@nestjs/testing';
import { UserController, UserService } from '../../user';
import { SessionGuard } from '../../../common/guards';

describe('UserController', () => {
  let controller: UserController;
  let service: any;

  beforeEach(async () => {
    const mockedUserService = {
      create: jest.fn(),
      delete: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockedUserService }],
    })
    .overrideGuard(SessionGuard)
    .useValue({ canActivate: jest.fn().mockReturnValue(true) })
    .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService) as any;
  });

  it('should call delete', async () => {
    service.delete.mockResolvedValue({ id: '1' });
    const result = await controller.delete('1');
    expect(result).toEqual({ id: '1' });
    expect(service.delete).toHaveBeenCalledWith('1');
  });

  it('should call updateProfile', async () => {
    service.updateProfile.mockResolvedValue({ id: '1', email: 'a' });
    const dto = { email: 'a' };
    const result = await controller.updateProfile('1', dto);
    expect(result).toEqual({ id: '1', email: 'a' });
    expect(service.updateProfile).toHaveBeenCalledWith('1', dto);
  });
});