import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { RegisterDto } from '../../auth/dto/register.dto';

export class CreateAuthorDto extends PickType(RegisterDto, [
  'email',
  'password',
] as const) {
  @ApiProperty({
    minLength: 1,
    description: 'Required display name; trimmed before validation.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    writeOnly: true,
    description:
      'Initial password. Uses the existing registration policy; never returned or emailed.',
  })
  declare password: string;
}
