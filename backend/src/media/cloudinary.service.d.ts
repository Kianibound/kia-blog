import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
export declare class CloudinaryService {
    private readonly configService;
    constructor(configService: ConfigService);
    uploadImage(file: Express.Multer.File): Promise<UploadApiResponse>;
    deleteImage(publicId: string): Promise<any>;
}
