import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../common/dto/response.dto';
import { PaginationMetaResponseDto } from '../../posts/dto/post-response.dto';
import { CommentStatus } from '../../generated/prisma/client';

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  content: string;
  @ApiProperty({
    enum: CommentStatus,
    description:
      'PENDING comments are hidden from public reads; APPROVED are publicly visible.',
  })
  status: CommentStatus;
  @ApiProperty({
    type: 'integer',
    description:
      'Monotonic revision counter; incremented on content edits and on approval, and used for stale-approval protection.',
  })
  version: number;
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ format: 'uuid' })
  authorId: string;
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  parentId: string | null;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class CommentAuthorResponseDto extends CommentResponseDto {
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;
}

export class CommentThreadResponseDto extends CommentAuthorResponseDto {
  @ApiProperty({ type: [CommentAuthorResponseDto] })
  replies: CommentAuthorResponseDto[];
}

// ADMIN dashboard row: moderation fields plus minimal safe author identity.
// Deliberately excludes article/post references.
export class AdminCommentSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ enum: CommentStatus })
  status: CommentStatus;
  @ApiProperty()
  content: string;
  @ApiProperty({
    type: 'integer',
    description: 'Version required by the approval action.',
  })
  version: number;
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class AdminCommentsResponseDto {
  @ApiProperty({ type: [AdminCommentSummaryResponseDto] })
  data: AdminCommentSummaryResponseDto[];

  @ApiProperty({ type: PaginationMetaResponseDto })
  meta: PaginationMetaResponseDto;
}
