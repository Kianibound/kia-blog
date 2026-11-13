import { ApiProperty, OmitType } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AvatarResponseDto extends OmitType(UserResponseDto, [
  'emailVerified',
] as const) {}

export class MediaResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty()
  url: string;
  @ApiProperty()
  publicId: string;
  @ApiProperty()
  resourceType: string;
  @ApiProperty()
  format: string;
  @ApiProperty({ type: 'integer' })
  bytes: number;
  @ApiProperty({ type: 'integer', nullable: true })
  width: number | null;
  @ApiProperty({ type: 'integer', nullable: true })
  height: number | null;
  @ApiProperty({ format: 'uuid' })
  ownerId: string;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
