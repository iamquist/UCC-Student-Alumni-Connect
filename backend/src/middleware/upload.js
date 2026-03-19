import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateUniqueFilename, ensureDirectory } from '../utils/fileUtils.js';
import { UPLOAD_CONFIG } from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../..', UPLOAD_CONFIG.dir);

// Ensure upload dirs exist
await ensureDirectory(uploadDir);
await ensureDirectory(path.join(uploadDir, 'images'));
await ensureDirectory(path.join(uploadDir, 'documents'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = UPLOAD_CONFIG.allowedImages.includes(file.mimetype);
    cb(null, path.join(uploadDir, isImage ? 'images' : 'documents'));
  },
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

const imageFilter = (req, file, cb) => {
  if (UPLOAD_CONFIG.allowedImages.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const documentFilter = (req, file, cb) => {
  if (UPLOAD_CONFIG.allowedDocs.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (PDF, DOC, DOCX)'), false);
  }
};

const baseOptions = {
  storage,
  limits: { fileSize: UPLOAD_CONFIG.maxSize, files: 10 },
};

export const uploadSingle = (fieldName) => multer({ ...baseOptions }).single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 5) => multer({ ...baseOptions }).array(fieldName, maxCount);
export const uploadFields = (fields) => multer({ ...baseOptions }).fields(fields);
export const uploadImage = (fieldName) => multer({ ...baseOptions, fileFilter: imageFilter }).single(fieldName);
export const uploadDocument = (fieldName) => multer({ ...baseOptions, fileFilter: documentFilter }).single(fieldName);

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: `File too large. Max size: ${UPLOAD_CONFIG.maxSize / 1024 / 1024}MB`, data: null });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files', data: null });
    }
    return res.status(400).json({ success: false, message: err.message, data: null });
  }
  if (err) return res.status(400).json({ success: false, message: err.message, data: null });
  next();
};

export default { uploadSingle, uploadMultiple, uploadFields, uploadImage, uploadDocument, handleUploadError };
