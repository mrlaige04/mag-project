import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    example: '4111111111111111',
    description: 'Sender card number (16 digits, no spaces)',
  })
  senderCardNumber: string;

  @ApiProperty({
    example: '4222222222222222',
    description: 'Receiver card number (16 digits, no spaces)',
  })
  receiverCardNumber: string;

  @ApiProperty({
    example: 500,
    description: 'Transfer amount in the specified currency',
  })
  amount: number;

  @ApiProperty({
    example: 'UAH',
    description: 'Currency code (ISO 4217)',
  })
  currency: string;
}
