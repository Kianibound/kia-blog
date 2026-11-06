import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { MessageResponseDto } from '../../common/dto/response.dto';

export class AccessTokenResponseDto {
  @ApiProperty({
    description:
      'Bearer JWT bound to a live refresh-token session via sid. Use only server-side in a browser adapter; do not place in browser storage.',
  })
  accessToken: string;
}

export class LoginResponseDto extends AccessTokenResponseDto {
  @ApiProperty({
    description:
      'Server-managed refresh credential. Store securely on the Next.js server, associated with an HttpOnly browser session cookie.',
  })
  refreshToken: string;
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class RegisterResponseDto extends MessageResponseDto {
  @ApiProperty({
    type: UserResponseDto,
    description:
      'Created USER account; registration does not return session tokens.',
  })
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
