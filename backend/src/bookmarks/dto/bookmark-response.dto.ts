import { ApiProperty } from '@nestjs/swagger';
import { AuthorResponseDto } from '../../common/dto/response.dto';
import { PostWriteResponseDto } from '../../posts/dto/post-response.dto';

export class BookmarkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ format: 'uuid' })
  userId: string;
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class BookmarkedPostResponseDto extends PostWriteResponseDto {
  @ApiProperty({ type: AuthorResponseDto })
  author: AuthorResponseDto;
}

export class BookmarkDetailResponseDto extends BookmarkResponseDto {
  @ApiProperty({ type: BookmarkedPostResponseDto })
  post: BookmarkedPostResponseDto;
}
