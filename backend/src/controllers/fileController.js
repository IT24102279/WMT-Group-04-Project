const { GridFSBucket } = require('mongodb');
const { getConnection } = require('../config/db');

/**
 * Streams a file from GridFS to the response
 */
const getFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const conn = getConnection();
    
    if (!conn || !conn.db) {
      return res.status(500).json({ message: 'Database connection not established' });
    }

    const bucket = new GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });

    const files = await bucket.find({ filename }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    
    // Set proper content type
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Length', file.length);
    
    // Stream from GridFS
    const downloadStream = bucket.openDownloadStreamByName(filename);
    
    downloadStream.on('error', (err) => {
      console.error('GridFS download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = { getFile };
