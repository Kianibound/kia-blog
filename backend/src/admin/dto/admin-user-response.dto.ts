import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AdminUserResponseDto extends UserResponseDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'Null for enabled accounts; the deactivation timestamp for disabled accounts.',
  })
  disabledAt: Date | null;
}
