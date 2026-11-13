import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
