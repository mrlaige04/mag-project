import { ApiProperty } from '@nestjs/swagger';

export class AdminVerifyDto {
  @ApiProperty({
    example: 'a8f5f167-2e4f-4b9e-8c2d-123456789abc',
    description: 'ID of the document to verify',
  })
  documentId: string;

  @ApiProperty({
    example: 'approve',
    description: 'Verification action to perform',
    enum: ['approve', 'reject'],
  })
  action: 'approve' | 'reject';
}
