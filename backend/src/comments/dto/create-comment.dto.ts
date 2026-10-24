import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  content: string;
}
