import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import 'multer';

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'financeflow_receipts' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      // TypeScript now knows 'file' is a Multer file, so .buffer is perfectly valid!
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
