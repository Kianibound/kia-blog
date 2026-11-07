import { ApiProperty } from '@nestjs/swagger';
import {
  GoogleAuthorizationResponseDto,
  GoogleCallbackDto,
} from './google-oauth.dto';

// Reuse the approved adapter payload and validation without changing Google.
export class GithubCallbackDto extends GoogleCallbackDto {
  @ApiProperty({
    required: false,
    description:
      'Authorization code from GitHub; mutually exclusive with error.',
  })
  declare code?: string;
}

export class GithubAuthorizationResponseDto extends GoogleAuthorizationResponseDto {}
