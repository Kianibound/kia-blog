import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DirectionAttributesDto {
  @ApiPropertyOptional({
    type: String,
    enum: ['rtl', 'ltr', 'auto'],
    nullable: true,
  })
  dir?: string | null;
}

class NodeAttributesDto extends DirectionAttributesDto {
  @ApiPropertyOptional({
    enum: [2, 3, 4],
    description: 'Required on heading; forbidden on other nodes.',
  })
  level?: number;
  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 1000000,
    description: 'orderedList only.',
  })
  start?: number;
  @ApiPropertyOptional({
    type: String,
    enum: ['1', 'a', 'A', 'i', 'I'],
    nullable: true,
    description: 'orderedList only.',
  })
  type?: string | null;
  @ApiPropertyOptional({
    type: String,
    maxLength: 64,
    pattern: '^[A-Za-z0-9_+.#-]*$',
    nullable: true,
    description: 'codeBlock only; a renderer hint, never executable code.',
  })
  language?: string | null;
}

class LinkAttributesDto {
  @ApiProperty({
    maxLength: 2048,
    description:
      'Absolute HTTP(S) URL; no credentials, whitespace or control characters.',
  })
  href: string;
  @ApiPropertyOptional({
    type: String,
    enum: ['_blank', '_self'],
    nullable: true,
  })
  target?: string | null;
  @ApiPropertyOptional({
    type: String,
    maxLength: 64,
    nullable: true,
    description:
      'When a string, only noopener/noreferrer/nofollow tokens with both noopener and noreferrer. Null only with explicit null or _self target.',
  })
  rel?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    enum: [null],
    description: 'Only null is accepted; arbitrary CSS classes are forbidden.',
  })
  class?: null;
  @ApiPropertyOptional({ type: String, maxLength: 256, nullable: true })
  title?: string | null;
}

class TiptapMarkDto {
  @ApiProperty({ enum: ['bold', 'italic', 'code', 'link'] })
  type: string;
  @ApiPropertyOptional({
    type: LinkAttributesDto,
    description:
      'Required for link. Other marks have no attributes. Duplicate marks and combining code with other marks are forbidden.',
  })
  attrs?: LinkAttributesDto;
}

export class TiptapNodeDto {
  @ApiProperty({
    enum: [
      'paragraph',
      'heading',
      'bulletList',
      'orderedList',
      'listItem',
      'blockquote',
      'codeBlock',
      'hardBreak',
      'text',
    ],
  })
  type: string;
  @ApiPropertyOptional({
    type: NodeAttributesDto,
    description:
      'Only node-specific attributes; text has no attributes. Unknown attributes are rejected.',
  })
  attrs?: NodeAttributesDto;
  @ApiPropertyOptional({
    minLength: 1,
    description:
      'Required on text only. Literal Unicode, never HTML; NUL/unpaired surrogates are forbidden.',
  })
  text?: string;
  @ApiPropertyOptional({
    type: [TiptapMarkDto],
    description: 'Text/hardBreak only; codeBlock text has no marks.',
  })
  marks?: TiptapMarkDto[];
  @ApiPropertyOptional({
    type: () => [TiptapNodeDto],
    description:
      'Blocks contain blocks; paragraphs/headings contain inline nodes; lists contain listItem+; listItem begins with paragraph; codeBlock contains text only. Text/hardBreak have no content.',
  })
  content?: TiptapNodeDto[];
}

export class TiptapDocumentDto {
  @ApiProperty({ enum: ['doc'] })
  type: 'doc';
  @ApiPropertyOptional({ type: DirectionAttributesDto })
  attrs?: DirectionAttributesDto;
  @ApiProperty({
    type: [TiptapNodeDto],
    minItems: 1,
    description:
      'Block nodes only. Entire serialized document <=65536 UTF-8 bytes, depth <=16 including root/text, and <=2000 nodes plus marks. No images, covers, HTML or preview envelope.',
  })
  content: TiptapNodeDto[];
}
