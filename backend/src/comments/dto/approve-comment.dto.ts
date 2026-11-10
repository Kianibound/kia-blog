import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ApproveCommentDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description:
      'Comment version from the ADMIN inventory row. Approval fails with 409 if the comment changed since it was loaded.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version: number;
}
