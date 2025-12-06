import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  Get,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { File } from 'multer';
import { AdminVerifyDto } from './dto';
import { JwtGuard, AdminRoleGuard } from '@app/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ID document for verification' })
  @ApiBody({
    description: 'Payload for document upload',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: {
          type: 'string',
          enum: ['id_card', 'drivers_license'],
        },
      },
      required: ['file', 'documentType'],
      example: {
        documentType: 'id_card',
        file: '(binary file)',
      },
    },
  })
  @ApiOkResponse({ description: 'Verification submitted' })
  async verify(
    @UploadedFile() file: File,
    @Req() req,
    @Body('documentType') documentType: string,
  ) {
    const userId = req.user.userId;
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!userId || !documentType) {
      throw new BadRequestException('userId and documentType are required');
    }
    if (documentType !== 'id_card' && documentType !== 'drivers_license') {
      throw new BadRequestException('Invalid documentType');
    }
    return await this.verificationService.verifyUser(
      userId,
      file,
      documentType,
    );
  }

  @Post('verify')
  @UseGuards(JwtGuard, AdminRoleGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin verifies a document by id' })
  @ApiBody({
    description: 'Admin verification action',
    type: AdminVerifyDto,
    schema: {
      example: {
        documentId: 'a8f5f167-2e4f-4b9e-8c2d-123456789abc',
        action: 'approve',
      },
    },
  })
  @ApiOkResponse({ description: 'Document verified by admin' })
  async adminVerify(@Body() verifyDto: AdminVerifyDto) {
    if (!verifyDto.documentId) {
      throw new BadRequestException('documentId is required');
    }

    return await this.verificationService.adminVerify(verifyDto);
  }

  @Get('/check-verification')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user verification status' })
  @ApiOkResponse({ description: 'Verification status returned' })
  async getVerification(@Req() req) {
    const userId = req.user.userId;
    return await this.verificationService.getVerification(userId);
  }

  @Get('/all')
  @UseGuards(JwtGuard, AdminRoleGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all verifications (admin only)' })
  @ApiOkResponse({ description: 'All verifications returned' })
  async getAllVerifications() {
    return await this.verificationService.getAllVerifications();
  }
}
