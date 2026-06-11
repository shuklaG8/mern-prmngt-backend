import fs from 'fs';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { ApiError } from '../utils/apiError.js';

export class UploadService {
  static async uploadFile(file) {
    if (!file) {
      throw new ApiError(400, 'No file provided');
    }

    try {
      if (isCloudinaryConfigured) {
        try {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'project_management_system',
            resource_type: 'auto',
          });

          // Delete local temp file
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error(`❌ Failed to delete temp file ${file.path}:`, err.message);
          }

          return {
            url: result.secure_url,
            public_id: result.public_id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          };
        } catch (cloudinaryError) {
          console.warn(`⚠️ Cloudinary upload failed (e.g. invalid signature/credentials). Falling back to local storage. Error: ${cloudinaryError.message}`);
          // Fall through to local storage handling below
        }
      }

      // Cloudinary not configured or upload failed, return local path
      const localUrl = `/uploads/${file.filename}`;

      return {
        url: localUrl,
        public_id: null,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      // Clean up local file in case of any other unexpected error
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        // ignore
      }
      throw new ApiError(500, `File upload failed: ${error.message}`);
    }
  }

  static async deleteFile(publicId, localPath) {
    try {
      if (isCloudinaryConfigured && publicId) {
        await cloudinary.uploader.destroy(publicId);
      } else if (localPath) {
        // Resolve filename from path
        const filename = localPath.replace('/uploads/', '');
        const fullPath = `./src/uploads/${filename}`;
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      return true;
    } catch (error) {
      console.error('❌ File deletion error:', error.message);
      return false;
    }
  }
}

export default UploadService;
