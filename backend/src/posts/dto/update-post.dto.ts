import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePostDto {
  @ApiPropertyOptional({ minLength: 1 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ minLength: 1 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    type: TiptapDocumentDto,
    description:
      'Canonical Tiptap document; mutually exclusive with content. A legacy content update clears it; omission preserves it.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @Validate(RichDocumentConstraint)
  contentDocument?: unknown;

  @ApiPropertyOptional({ enum: PostStatus })
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
