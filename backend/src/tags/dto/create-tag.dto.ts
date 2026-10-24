import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @IsNotEmpty()
  name: string;
}
