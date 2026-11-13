import { PickType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../posts/dto/pagination-query.dto';

export class MyCommentsQueryDto extends PickType(PaginationQueryDto, [
  'page',
  'limit',
] as const) {}
