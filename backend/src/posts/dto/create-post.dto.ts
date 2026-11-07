import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidateIf,
} from 'class-validator';

import { PostStatus } from '../../generated/prisma/client';
import { RichDocumentConstraint } from '../rich-document';
import { TiptapDocumentDto } from './tiptap-document.dto';

export class CreatePostDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Literal legacy text; supply either content or contentDocument, not both.',
  })
  @ValidateIf(
    (object: { contentDocument?: unknown }, value: unknown) =>
      value !== undefined || object.contentDocument === undefined,
  )
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    type: TiptapDocumentDto,
    description: 'Canonical Tiptap document; mutually exclusive with content.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Validate(RichDocumentConstraint)
  contentDocument?: unknown;

  @ApiPropertyOptional({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
