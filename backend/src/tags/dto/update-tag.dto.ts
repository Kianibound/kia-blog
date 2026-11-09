import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Tag name; surrounding whitespace is trimmed and blank values are rejected.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  name?: string;
}
