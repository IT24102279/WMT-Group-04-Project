const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const fullUploadPath = path.join(process.cwd(), uploadDir);

if (!fs.existsSync(fullUploadPath)) {
  fs.mkdirSync(fullUploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, fullUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and PDF files are allowed'));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;
