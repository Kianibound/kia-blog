import { ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PostStatus } from '../../generated/prisma/client';
import { PaginationQueryDto } from './pagination-query.dto';

export class AdminPostsQueryDto extends PickType(PaginationQueryDto, [
  'page',
  'limit',
] as const) {
  @ApiPropertyOptional({
    enum: [PostStatus.DRAFT, PostStatus.PUBLISHED],
    description:
      'Filter inventory posts by status. Omit for all statuses, including DEPRECATED.',
  })
  @IsOptional()
  @IsIn([PostStatus.DRAFT, PostStatus.PUBLISHED])
  status?: PostStatus;
}
