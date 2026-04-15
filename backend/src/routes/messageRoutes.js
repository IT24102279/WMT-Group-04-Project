const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getMessages,
  getConversations,
  replyToMessage,
  markAsRead,
  getMessageThread,
  deleteMessage,
  updateMessage,
  deleteConversation
} = require('../controllers/messageController');

const router = express.Router();

// All message routes require authentication
router.use(verifyToken);

// Send a new message
router.post('/', sendMessage);

// Get all messages for current user
router.get('/', getMessages);

// Get conversation threads
router.get('/conversations', getConversations);

// Get message thread (original + all replies)
router.get('/thread/:messageId', getMessageThread);

// Reply to a message
router.post('/:messageId/reply', replyToMessage);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Delete message
router.delete('/:messageId', deleteMessage);

// Update message
router.put('/:messageId', updateMessage);

// Delete conversation with a partner
router.delete('/conversation/:partnerId', deleteConversation);

module.exports = router;
