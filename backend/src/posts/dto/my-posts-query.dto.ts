import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PostStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class MyPostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: [PostStatus.DRAFT, PostStatus.PUBLISHED],
    description:
      'Filter owned posts by status. Omit for all statuses, including DEPRECATED.',
  })
  @IsOptional()
  @IsIn([PostStatus.DRAFT, PostStatus.PUBLISHED])
  status?: PostStatus;
}
