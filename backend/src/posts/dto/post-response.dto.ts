import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '../../generated/prisma/client';
import {
  AuthorResponseDto,
  TaxonomyResponseDto,
  TaxonomySummaryResponseDto,
} from '../../common/dto/response.dto';

export class PostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  slug: string;
  @ApiProperty()
  content: string;
  @ApiProperty({ enum: PostStatus })
  status: PostStatus;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt: Date | null;
  @ApiProperty({ format: 'uuid' })
  authorId: string;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class PostDetailResponseDto extends PostResponseDto {
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;
  @ApiProperty({ type: [TaxonomySummaryResponseDto] })
  categories: TaxonomySummaryResponseDto[];
  @ApiProperty({ type: [TaxonomySummaryResponseDto] })
  tags: TaxonomySummaryResponseDto[];
}

export class PostWriteResponseDto extends PostResponseDto {
  @ApiProperty({ type: [TaxonomyResponseDto] })
  categories: TaxonomyResponseDto[];
  @ApiProperty({ type: [TaxonomyResponseDto] })
  tags: TaxonomyResponseDto[];
}

export class PaginationMetaResponseDto {
  @ApiProperty({ type: 'integer' })
  page: number;
  @ApiProperty({ type: 'integer' })
  limit: number;
  @ApiProperty({ type: 'integer' })
  total: number;
  @ApiProperty({ type: 'integer' })
  totalPages: number;
}

export class MyPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto] })
  data: PostResponseDto[];
  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}

export class PostFeedResponseDto {
  @ApiProperty({ type: [PostDetailResponseDto] })
  data: PostDetailResponseDto[];
  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
