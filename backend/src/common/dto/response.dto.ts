import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty()
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({ type: 'integer' })
  statusCode: number;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];
  @ApiProperty()
  error: string;
}

export class AuthorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ type: String, nullable: true })
  name: string | null;
  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;
}

export class TaxonomySummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  slug: string;
}

// Category and Tag have the same scalar response fields.
export class TaxonomyResponseDto extends TaxonomySummaryResponseDto {
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
