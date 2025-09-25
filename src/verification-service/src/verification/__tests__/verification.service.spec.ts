import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from '../../verification';
import { PrismaService } from '../../prisma';
import { S3Service } from '../../s3';
import { of } from 'rxjs';
import { InternalServerErrorException, ForbiddenException } from '@nestjs/common';

const mockS3Service = { uploadFile: jest.fn() };
const mockUserClient = { send: jest.fn() };

describe('VerificationService', () => {
  let service: VerificationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    mockS3Service.uploadFile.mockReset();
    mockUserClient.send.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'USER_SERVICE', useValue: mockUserClient },
        { provide: 'HISTORY_SERVICE', useValue: { send: jest.fn(() => of({})) } },
        { provide: S3Service, useValue: mockS3Service },
      ],
    })
      .compile();

    service = module.get<VerificationService>(VerificationService);
  });

  it('should create verification request', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    mockS3Service.uploadFile.mockResolvedValue('url');
    prisma.document.create.mockResolvedValue({ id: '1', status: 'pending' });
    const result = await service.verifyUser('userId', { originalname: 'f' } as any, 'id_card');
    expect(result).toHaveProperty('document');
    expect(prisma.document.create).toHaveBeenCalled();
  });

  it('should not create if verification exists', async () => {
    prisma.document.findFirst.mockResolvedValue({ id: '1', status: 'pending' });
    await expect(service.verifyUser('userId', { originalname: 'f' } as any, 'id_card')).rejects.toThrow();
  });

  it('should approve document in adminVerify', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 'doc1', userId: 'userId' });
    prisma.document.update.mockResolvedValue({ id: 'doc1', status: 'approved' });
    mockUserClient.send.mockReturnValue(of(true));
    const dto = { documentId: 'doc1', action: 'approve' };
    const result = await service.adminVerify(dto as any);
    expect(result).toHaveProperty('document');
    expect(prisma.document.update).toHaveBeenCalled();
  });

  it('should reject document in adminVerify', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 'doc1', userId: 'userId' });
    prisma.document.update.mockResolvedValue({ id: 'doc1', status: 'rejected' });
    const dto = { documentId: 'doc1', action: 'reject' };
    const result = await service.adminVerify(dto as any);
    expect(result.document.status).toBe('rejected');
  });

  it('should get verification for user', async () => {
    prisma.document.findFirst.mockResolvedValue({ id: 'doc1', userId: 'userId', status: 'pending' });
    const result = await service.getVerification('userId');
    expect(result).toHaveProperty('id', 'doc1');
  });

  it('should return not_verified if verification not found', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    await expect(service.getVerification('userId')).resolves.toEqual({ status: 'not_verified' });
  });

  it('should throw if verification belongs to another user', async () => {
    prisma.document.findFirst.mockResolvedValue({ id: 'doc1', userId: 'otherUser', status: 'pending' });
    await expect(service.getVerification('userId')).rejects.toThrow();
  });

  it('should throw if uploadFile fails', async () => {
    prisma.document.findFirst.mockResolvedValue(null);
    mockS3Service.uploadFile.mockRejectedValue(new Error('fail'));
    const file = { originalname: 'fail.png', buffer: Buffer.from('fail'), size: 4 } as any;
    await expect(service.verifyUser('userId', file, 'id_card')).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw if document not found in adminVerify', async () => {
    prisma.document.findUnique.mockResolvedValue(null);
    const dto = { documentId: 'notfound', action: 'approve' as 'approve' };
    await expect(service.adminVerify(dto)).rejects.toThrow('Document not found');
  });

  it('should not call userClient.send if action is reject', async () => {
    prisma.document.findUnique.mockResolvedValue({ id: 'doc1', userId: 'userId' });
    prisma.document.update.mockResolvedValue({ id: 'doc1', status: 'rejected' });
    const spy = jest.spyOn(mockUserClient, 'send');
    const dto = { documentId: 'doc1', action: 'reject' as 'reject' };
    await service.adminVerify(dto);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if document belongs to another user', async () => {
    prisma.document.findFirst.mockResolvedValue({ id: 'doc1', userId: 'otherUser', status: 'pending' });
    await expect(service.getVerification('userId')).rejects.toThrow(ForbiddenException);
  });
});