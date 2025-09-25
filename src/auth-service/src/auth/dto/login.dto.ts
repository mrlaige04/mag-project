import { IsString, MinLength, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
