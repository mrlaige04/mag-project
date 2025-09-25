import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationEventsController {
  constructor(private readonly verificationService: VerificationService) {}

  @MessagePattern({ cmd: 'get-verification-status' })
  async getVerificationStatus(userId: string) {
    return this.verificationService.getVerification(userId);
  }
}
