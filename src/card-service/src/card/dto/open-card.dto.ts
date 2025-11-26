import { ApiProperty } from '@nestjs/swagger';

export class OpenCardDto {
  @ApiProperty({
    example: 'debit',
    description: 'Type of card to open',
    enum: ['debit', 'credit'],
  })
  cardType: 'debit' | 'credit';

  @ApiProperty({
    example: 'visa',
    description: 'Card provider',
    enum: ['visa', 'mastercard'],
  })
  provider: 'visa' | 'mastercard';
}
