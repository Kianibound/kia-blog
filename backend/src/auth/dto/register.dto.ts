import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Legacy optional field. Defaults to user_ plus the SHA-256 hex digest of the exact email.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiProperty({
    minLength: 8,
    pattern: '^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[!-~]{8,}$',
    description:
      'At least 8 printable ASCII characters, including an English letter, digit and symbol; no whitespace.',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^[\x21-\x7e]+$/, {
    message:
      'password must contain only printable ASCII characters without whitespace',
  })
  @Matches(/[A-Za-z]/, { message: 'password must contain an English letter' })
  @Matches(/[0-9]/, { message: 'password must contain a digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'password must contain a symbol' })
  password: string;

  @ApiPropertyOptional({
    description:
      'Must exactly match password when supplied. Optional for legacy API clients; the frontend requires confirmation.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  confirmPassword?: string;

  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Legacy optional display name. Defaults to the resolved username.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name?: string;
}
