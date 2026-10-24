import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../common/dto/response.dto';

export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  content: string;
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
