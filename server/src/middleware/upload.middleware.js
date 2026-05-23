import multer from 'multer';
import multerS3 from 'multer-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { s3Client } from '../config/storage.js';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_TYPES = {
  product: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
  proof: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const MAX_SIZES = {
  product: 500 * 1024 * 1024, // 500 MB
  image: 5 * 1024 * 1024,     // 5 MB
  proof: 5 * 1024 * 1024,
};

function buildUpload(type, folder) {
  const useS3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_BUCKET);

  const storage = useS3
    ? multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET,
        key: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${folder}/${uuidv4()}${ext}`);
        },
      })
    : multer.memoryStorage();

  return multer({
    storage,
    limits: { fileSize: MAX_SIZES[type] },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_TYPES[type].includes(file.mimetype)) {
        return cb(new ApiError(400, `Invalid file type. Allowed: ${ALLOWED_TYPES[type].join(', ')}`));
      }
      cb(null, true);
    },
  });
}

export const uploadProductFile = buildUpload('product', 'products').single('file');
export const uploadProductImage = buildUpload('image', 'thumbnails').single('thumbnail');
export const uploadScreenshots = buildUpload('image', 'screenshots').array('screenshots', 10);
export const uploadPaymentProof = buildUpload('proof', 'proofs').single('proof');
export const uploadAvatar = buildUpload('image', 'avatars').single('avatar');
