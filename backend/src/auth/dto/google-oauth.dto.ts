import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GoogleCallbackDto {
  @ApiProperty({
    required: false,
    description:
      'Authorization code from Google; mutually exclusive with error.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  code?: string;

  @ApiProperty({
    required: false,
    description: 'Provider denial/error; mutually exclusive with code.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  error?: string;

  @ApiProperty()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  state: string;

  @ApiProperty({
    description:
      'Private verifier retained by the server adapter. Never send in a URL.',
  })
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  flowVerifier: string;
}

export class GoogleAuthorizationResponseDto {
  @ApiProperty()
  authorizationUrl: string;

  @ApiProperty({
    description: 'Keep server-side, bound to the initiating browser session.',
  })
  flowVerifier: string;

  @ApiProperty({ example: 600 })
  expiresIn: number;
}
