const express = require('express');
const { getFile } = require('../controllers/fileController');

const router = express.Router();

// Public route to access uploaded files
router.get('/:filename', getFile);

module.exports = router;
