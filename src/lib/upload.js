'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

/** Allowed image types. SVG is intentionally excluded (it can carry scripts). */
const TYPES = {
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': {
    ext: 'png',
    magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    ext: 'webp',
    magic: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
  'image/gif': { ext: 'gif', magic: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
};

class UploadError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Multer in memory so we can check magic bytes before anything touches the disk. */
function imageUpload(config) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.uploadMaxBytes, files: 1, fields: 5 },
    fileFilter: (_req, file, cb) => {
      if (!TYPES[file.mimetype]) {
        return cb(new UploadError(415, 'unsupported_type', 'Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz.'));
      }
      return cb(null, true);
    },
  }).single('image');
}

/**
 * Verifies the content really is the declared image type and writes it under
 * uploads/<slug>/<random>.<ext>. The original file name is never used.
 */
function saveImage(config, slug, file) {
  if (!file) throw new UploadError(400, 'no_file', 'Bir fotoğraf seçin.');
  const type = TYPES[file.mimetype];
  if (!type || file.buffer.length < 12 || !type.magic(file.buffer)) {
    throw new UploadError(415, 'unsupported_type', 'Dosya geçerli bir fotoğraf değil.');
  }
  const dir = path.join(config.uploadsDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}.${type.ext}`;
  fs.writeFileSync(path.join(dir, name), file.buffer, { flag: 'wx' });
  return `/uploads/${slug}/${name}`;
}

/** Deletes a previously uploaded file of this site (ignores anything outside uploads/<slug>/). */
function removeImage(config, slug, publicPath) {
  const prefix = `/uploads/${slug}/`;
  if (typeof publicPath !== 'string' || !publicPath.startsWith(prefix)) return;
  const name = path.basename(publicPath);
  if (!/^[a-z0-9]+-[a-f0-9]{16}\.(jpg|png|webp|gif)$/.test(name)) return;
  fs.rm(path.join(config.uploadsDir, slug, name), { force: true }, () => {});
}

module.exports = { imageUpload, saveImage, removeImage, UploadError };
