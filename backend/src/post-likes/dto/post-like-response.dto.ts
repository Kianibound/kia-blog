import { ApiProperty } from '@nestjs/swagger';

export class PostLikeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ format: 'uuid' })
  userId: string;
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

export class LikeCountResponseDto {
  @ApiProperty({ format: 'uuid' })
  postId: string;
  @ApiProperty({ type: 'integer' })
  likes: number;
}
