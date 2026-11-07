import { MediaResponseDto, AvatarResponseDto } from './dto/media-response.dto';
import {
  ErrorResponseDto,
  MessageResponseDto,
} from '../common/dto/response.dto';
import {
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { CurrentUser } from '../access-control/decorators/current-user.decorator';
import { JwtAuthGuard } from '../access-control/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../access-control/types/access-token-payload.type';
import { MediaService } from './media.service';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Upload an image',
    description:
      'JPEG, PNG or WebP detected from file bytes; strictly below 5 MiB. Use the returned Media id in article image attrs.mediaId, never a URL.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 413,
    description: 'Multipart file exceeds 5 MiB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    type: MediaResponseDto,
    status: 201,
    description: 'Image uploaded successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 422,
    description: 'Invalid file type or file larger than 5 MB.',
  })
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadImage(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image\/(jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.mediaService.uploadImage(user.sub, file);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete an uploaded media item' })
  @ApiResponse({
    type: MessageResponseDto,
    status: 200,
    description: 'Media deleted successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 403,
    description: 'User cannot delete this media.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 409,
    description:
      'Referenced by a draft, published or deprecated article; detach first. No remote image is deleted.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 404,
    description: 'Media not found.',
  })
  @Delete(':mediaId')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.mediaService.remove(mediaId, user.sub, user.role);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload or replace the current user avatar' })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 413,
    description: 'Multipart file exceeds 5 MiB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    type: AvatarResponseDto,
    status: 200,
    description: 'Avatar updated successfully.',
  })
  @ApiResponse({
    type: ErrorResponseDto,
    status: 422,
    description: 'Invalid file type or file larger than 5 MB.',
  })
  @Patch('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  updateAvatar(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^image\/(jpeg|png|webp)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.mediaService.updateAvatar(user.sub, file);
  }
}
