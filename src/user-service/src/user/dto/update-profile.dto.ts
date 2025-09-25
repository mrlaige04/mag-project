import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  MinLength,
  IsString,
} from 'class-validator';

export class UpdateProfileDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
