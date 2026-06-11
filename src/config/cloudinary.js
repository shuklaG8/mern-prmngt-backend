import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const isCloudinaryConfigured = !!(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️ Cloudinary Configured Successfully');
} else {
  console.log('📁 Cloudinary not configured. File uploads will default to Local Storage.');
}

export { cloudinary, isCloudinaryConfigured };
