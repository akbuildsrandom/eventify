import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const isConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const uploadToCloudinary = async (fileBuffer, folder = 'eventify/events') => {
  if (!isConfigured) {
    // If not configured, return a high-quality fallback event banner or base64 data URI
    // and log a clear notice so user knows Cloudinary is unconfigured
    console.warn('ℹ️ Cloudinary is not configured. Using standard event image placeholder.');
    return {
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      publicId: `placeholder_${Date.now()}`,
      isConfigured: false,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 630, crop: 'fill', gravity: 'auto' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          isConfigured: true,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export { cloudinary, isConfigured as isCloudinaryConfigured };
