import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    minLength: 1,
    description:
      'Tag name; surrounding whitespace is trimmed and blank values are rejected.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
