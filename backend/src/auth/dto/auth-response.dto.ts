import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { MessageResponseDto } from '../../common/dto/response.dto';

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken: string;
}

export class LoginResponseDto extends AccessTokenResponseDto {
  @ApiProperty()
  refreshToken: string;
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class RegisterResponseDto extends MessageResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
  @ApiPropertyOptional({ description: 'Only returned outside production.' })
  verificationUrl?: string;
}

export class ForgotPasswordResponseDto extends MessageResponseDto {
  @ApiPropertyOptional({
    description: 'Only returned outside production for an existing account.',
  })
  resetUrl?: string;
}
