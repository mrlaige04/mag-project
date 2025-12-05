import { Test, TestingModule } from '@nestjs/testing';
import { VerificationController, VerificationService } from '../../verification';
import { JwtGuard, AdminRoleGuard } from '@app/common';

describe('VerificationController', () => {
  let controller: VerificationController;
  let service: any;

  beforeEach(async () => {
    service = {
      verifyUser: jest.fn(),
      adminVerify: jest.fn(),
      getVerification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationController],
      providers: [
        { provide: VerificationService, useValue: service },
        { provide: 'AUTH_SERVICE', useValue: {} },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(AdminRoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VerificationController>(VerificationController);
  });

  it('should call verifyUser', async () => {
    service.verifyUser.mockResolvedValue({ userId: '1', document: { id: 'doc1', status: 'pending' } });
    const req = { user: { userId: '1' } };
    const file = { originalname: 'f' };
    const result = await controller.verify(file as any, req as any, 'id_card');
    expect(result).toHaveProperty('document');
    expect(service.verifyUser).toHaveBeenCalledWith('1', file, 'id_card');
  });

  it('should call adminVerify', async () => {
    service.adminVerify.mockResolvedValue({ userId: '1', documentId: 'doc1', document: { status: 'approved' } });
    const dto = { documentId: 'doc1', action: 'approve' as 'approve' };
    const result = await controller.adminVerify(dto);
    expect(result).toHaveProperty('documentId', 'doc1');
    expect(service.adminVerify).toHaveBeenCalledWith(dto);
  });

  it('should call getVerification', async () => {
    service.getVerification.mockResolvedValue({ id: 'doc1', status: 'pending' });
    const req = { user: { userId: '1' } };
    const result = await controller.getVerification(req as any);
    expect(result).toEqual({ id: 'doc1', status: 'pending' });
    expect(service.getVerification).toHaveBeenCalledWith('1');
  });

  it('should throw if file is missing', async () => {
    const req = { user: { userId: '1' } };
    await expect(controller.verify(undefined as any, req as any, 'id_card'))
      .rejects.toThrow('File is required');
  });

  it('should throw if userId is missing', async () => {
    const file = { originalname: 'f' };
    const req = { user: {} };
    await expect(controller.verify(file as any, req as any, 'id_card'))
      .rejects.toThrow('userId and documentType are required');
  });

  it('should throw if documentType is missing', async () => {
    const file = { originalname: 'f' };
    const req = { user: { userId: '1' } };
    await expect(controller.verify(file as any, req as any, undefined as any))
      .rejects.toThrow('userId and documentType are required');
  });

  it('should throw if documentType is invalid', async () => {
    const file = { originalname: 'f' };
    const req = { user: { userId: '1' } };
    await expect(controller.verify(file as any, req as any, 'passport'))
      .rejects.toThrow('Invalid documentType');
  });

  it('should throw if documentId is missing in adminVerify', async () => {
    await expect(controller.adminVerify({ action: 'approve' } as any))
      .rejects.toThrow('documentId is required');
  });
});