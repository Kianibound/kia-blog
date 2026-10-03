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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/types/access-token-payload.type';
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
  @ApiOperation({ summary: 'Upload an image' })
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
  @ApiResponse({ status: 201, description: 'Image uploaded successfully.' })
  @ApiResponse({
    status: 422,
    description: 'Invalid file type or file larger than 5 MB.',
  })
  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
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
  @ApiResponse({ status: 200, description: 'Media deleted successfully.' })
  @ApiResponse({ status: 403, description: 'User cannot delete this media.' })
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
  @ApiResponse({ status: 200, description: 'Avatar updated successfully.' })
  @ApiResponse({
    status: 422,
    description: 'Invalid file type or file larger than 5 MB.',
  })
  @Patch('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
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
