import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const ensureDirectory = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const fileExists = async (filePath) => {
  try { await fs.access(filePath); return true; } catch { return false; }
};

export const directoryExists = async (dirPath) => {
  try { const s = await fs.stat(dirPath); return s.isDirectory(); } catch { return false; }
};

export const getFileSize = async (filePath) => {
  const s = await fs.stat(filePath);
  return s.size;
};

export const getFileSizeHuman = async (filePath) => {
  const bytes = await getFileSize(filePath);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileExtension = (filename) =>
  path.extname(filename).toLowerCase().slice(1);

export const getFilenameWithoutExtension = (filename) =>
  path.basename(filename, path.extname(filename));

export const generateUniqueFilename = (originalFilename, prefix = '') => {
  const ext = path.extname(originalFilename);
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}_${random}${ext}`;
};

export const sanitizeFilename = (filename) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');

const MIME_MAP = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
  mp3: 'audio/mpeg', wav: 'audio/wav',
};

export const getMimeType = (filename) => {
  const ext = getFileExtension(filename);
  return MIME_MAP[ext] || 'application/octet-stream';
};

export const isImageFile = (filename) => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(getFileExtension(filename));
export const isDocumentFile = (filename) => ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(getFileExtension(filename));
export const isVideoFile = (filename) => ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(getFileExtension(filename));

export const deleteFile = async (filePath) => {
  if (await fileExists(filePath)) await fs.unlink(filePath);
};

export const copyFile = async (source, dest) => {
  await ensureDirectory(path.dirname(dest));
  await fs.copyFile(source, dest);
};

export const moveFile = async (source, dest) => {
  await copyFile(source, dest);
  await deleteFile(source);
};

export const readFile = async (filePath, encoding = 'utf8') =>
  fs.readFile(filePath, { encoding });

export const writeFile = async (filePath, content) => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
};

export const getFileHash = async (filePath) => {
  const content = await fs.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
};

export const listFiles = async (dirPath, recursive = false) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && recursive) {
      files.push(...await listFiles(fullPath, true));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
};

export const getFileStats = async (filePath) => fs.stat(filePath);

export default {
  ensureDirectory, fileExists, directoryExists, getFileSize, getFileSizeHuman,
  getFileExtension, getFilenameWithoutExtension, generateUniqueFilename, sanitizeFilename,
  getMimeType, isImageFile, isDocumentFile, isVideoFile, deleteFile, copyFile, moveFile,
  readFile, writeFile, getFileHash, listFiles, getFileStats,
};
