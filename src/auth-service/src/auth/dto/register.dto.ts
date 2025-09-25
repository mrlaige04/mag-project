import {
  IsEmail,
  IsString,
  MinLength,
  IsPhoneNumber,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  fullName: string;

  @IsDateString()
  dateOfBirth: string;
}
