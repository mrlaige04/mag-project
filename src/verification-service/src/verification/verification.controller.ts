import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  UseGuards,
  Req,
  Get
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerificationService } from './verification.service';
import { File } from 'multer';
import { AdminVerifyDto } from './dto';
import { SessionGuard, AdminRoleGuard } from '../../common/guards';
import { ApiTags, ApiOperation, ApiCookieAuth, ApiConsumes, ApiBody, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ID document for verification' })
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' }, documentType: { type: 'string', enum: ['id_card','drivers_license'] } }, required: ['file','documentType'] } })
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

  @Post('admin')
  @UseGuards(SessionGuard, AdminRoleGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Admin verifies a document by id' })
  @ApiBody({ type: AdminVerifyDto })
  @ApiOkResponse({ description: 'Document verified by admin' })
  async adminVerify(@Body() verifyDto: AdminVerifyDto) {
    if (!verifyDto.documentId) {
      throw new BadRequestException('documentId is required');
    }

    return await this.verificationService.adminVerify(verifyDto);
  }

  @Get('/check-verification')
  @UseGuards(SessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get current user verification status' })
  @ApiOkResponse({ description: 'Verification status returned' })
  async getVerification(@Req() req) {
    const userId = req.user.userId;
    return await this.verificationService.getVerification(userId);
  }
}
