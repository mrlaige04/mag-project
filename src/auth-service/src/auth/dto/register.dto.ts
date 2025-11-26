import {
  IsEmail,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+380931234567',
    description: 'User phone number in international format',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: 'StrongPassword123',
    description: 'User password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'Date of birth in ISO format (YYYY-MM-DD)',
  })
  @IsDateString()
  dateOfBirth: string;
}
