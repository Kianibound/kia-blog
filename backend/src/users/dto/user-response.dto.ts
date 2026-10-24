import { ApiProperty } from '@nestjs/swagger';

export class UserRoleResponseDto {
  @ApiProperty()
  name: string;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ format: 'email' })
  email: string;
  @ApiProperty()
  username: string;
  @ApiProperty({ type: String, nullable: true })
  name: string | null;
  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;
  @ApiProperty()
  emailVerified: boolean;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
  @ApiProperty({ type: UserRoleResponseDto, nullable: true })
  role: UserRoleResponseDto | null;
}
