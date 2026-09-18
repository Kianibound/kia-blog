import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { PostStatus } from '../../../generated/prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
