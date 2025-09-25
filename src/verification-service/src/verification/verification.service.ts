import {
  Injectable,
  InternalServerErrorException,
  Inject,
  ForbiddenException
} from '@nestjs/common';
import { S3Service } from '../s3';
import { File } from 'multer';
import { PrismaService } from '../prisma';
import { ClientProxy } from '@nestjs/microservices';
import { AdminVerifyDto } from './dto';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class VerificationService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async verifyUser(
    userId: string,
    file: File,
    documentType: string,
  ): Promise<any> {
    try {
      const existing = await this.prisma.document.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'approved'] },
        },
      });
      if (existing) {
        throw new InternalServerErrorException('Verification already exists');
      }
      const fileUrl = await this.s3Service.uploadFile(file);

      const document = await this.prisma.document.create({
        data: {
          userId,
          documentType: documentType as any,
          documentNumber: '',
          issuedDate: new Date(),
          expiryDate: new Date(),
          fileUrl,
          status: 'pending',
        },
      });

      return { userId, document };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async adminVerify(verifyDto: AdminVerifyDto) {
    const document = await this.prisma.document.findUnique({
      where: { id: verifyDto.documentId },
    });
    if (!document) throw new Error('Document not found');

    const updatedDocument = await this.prisma.document.update({
      where: { id: verifyDto.documentId },
      data: {
        status: verifyDto.action === 'approve' ? 'approved' : 'rejected',
      },
    });

    if (verifyDto.action === 'approve') {
      await firstValueFrom(
        this.userClient.send(
          { cmd: 'change-user-status' },
          { userId: document.userId, status: 'active' }
        ).pipe(timeout(3000))
      );
    }

    return {
      userId: document.userId,
      documentId: verifyDto.documentId,
      document: updatedDocument,
    };
  }

  async getVerification(userId: string) {
    const verification = await this.prisma.document.findFirst({ where: { userId } });
    if (!verification) return { status: 'not_verified' };
    if (verification.userId !== userId) {
      throw new ForbiddenException('Access denied: not your verification');
    }
    return { id: verification.id, status: verification.status };
  }
}
