import { PickType } from '@nestjs/swagger';
import { PaginationQueryDto } from './pagination-query.dto';

export class AdminPostsQueryDto extends PickType(PaginationQueryDto, [
  'page',
  'limit',
] as const) {}
