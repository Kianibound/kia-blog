import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    minLength: 1,
    description:
      'Comment text; surrounding whitespace is trimmed and blank values are rejected.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
