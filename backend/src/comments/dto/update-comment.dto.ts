import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Updated comment text; surrounding whitespace is trimmed, blank values are rejected, and the comment returns to PENDING.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}
