import { IsString, MinLength, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '+380931234567',
    description: 'User phone number used for login',
  })
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
