import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  MinLength,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'New email address',
    example: 'newemail@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'New phone number',
    example: '+380501234567',
  })
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
