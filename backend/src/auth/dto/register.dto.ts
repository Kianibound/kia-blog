import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  name: string;
}
