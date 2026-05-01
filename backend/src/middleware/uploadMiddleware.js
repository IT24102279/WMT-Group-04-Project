const multer = require('multer');
const path = require('path');
const { getConnection } = require('../config/db');
const { GridFSBucket } = require('mongodb');

// Custom GridFS Storage Engine for Multer
class GridFsCustomStorage {
  constructor() {
    this.bucketName = 'uploads';
  }

  _handleFile(req, file, cb) {
    const conn = getConnection();
    if (!conn || !conn.db) {
      return cb(new Error('Database connection not established'));
    }

    const bucket = new GridFSBucket(conn.db, {
      bucketName: this.bucketName
    });

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype
    });

    file.stream.pipe(uploadStream);

    uploadStream.on('error', (err) => cb(err));
    uploadStream.on('finish', () => {
      cb(null, {
        filename: filename,
        id: uploadStream.id
      });
    });
  }

  _removeFile(req, file, cb) {
    const conn = getConnection();
    if (!conn || !conn.db) {
      return cb(new Error('Database connection not established'));
    }

    const bucket = new GridFSBucket(conn.db, {
      bucketName: this.bucketName
    });

    bucket.delete(file.id, (err) => cb(err));
  }
}

const storage = new GridFsCustomStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, and PDF files are allowed'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
