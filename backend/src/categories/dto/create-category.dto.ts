import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  name: string;
}
