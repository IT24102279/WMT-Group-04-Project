const Message = require('../models/Message');
const User = require('../models/User');

// Send a message (end-users send to admins/staff, admins send to end-users)
const sendMessage = async (req, res, next) => {
  try {
    const { subject, content, recipientId } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;
    let resolvedRecipientId = recipientId || null;

    if (!subject || !content) {
      return res.status(400).json({ message: 'Subject and content are required' });
    }

    // If a customer does not pick a recipient, route to the first available support staff.
    if (!resolvedRecipientId && senderRole === 'customer') {
      const fallbackRecipient = await User.findOne({ role: { $in: ['admin', 'pharmacist', 'staff'] } }).sort({ createdAt: 1 });
      if (fallbackRecipient) {
        resolvedRecipientId = fallbackRecipient._id;
      }
    }

    // Validate recipient exists
    if (resolvedRecipientId) {
      const recipient = await User.findById(resolvedRecipientId);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient not found' });
      }
    }

    const message = await Message.create({
      senderId,
      senderRole,
      recipientId: resolvedRecipientId,
      subject,
      content,
      isReply: false
    });

    const populatedMessage = await message.populate('senderId', 'name email role');

    return res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    return next(error);
  }
};

// Get messages for the current user
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query;

    if (userRole === 'admin' || userRole === 'pharmacist' || userRole === 'staff') {
      // Admin/staff can see all messages OR messages sent to them
      query = Message.find({
        $or: [
          { recipientId: userId },
          { senderRole: 'customer' }
        ]
      });
    } else {
      // End-users see messages sent by them or replies to them
      query = Message.find({
        $or: [
          { senderId: userId },
          { senderId: { $in: (await User.find({ role: { $in: ['admin', 'pharmacist', 'staff'] } })).map(u => u._id) },
            recipientId: userId
          }
        ]
      });
    }

    const messages = await query
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 });

    return res.json({
      message: 'Messages retrieved successfully',
      data: messages
    });
  } catch (error) {
    return next(error);
  }
};

// Get conversation threads (grouped messages)
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const isSupportUser = userRole === 'admin' || userRole === 'pharmacist' || userRole === 'staff';

    let messageFilter;

    if (isSupportUser) {
      const customers = await User.find({ role: 'customer' }).select('_id');
      const customerIds = customers.map((customer) => customer._id);

      messageFilter = {
        $or: [
          { senderRole: 'customer' },
          { recipientId: { $in: customerIds } }
        ]
      };
    } else {
      messageFilter = {
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ]
      };
    }

    // For support users: include all customer-facing threads.
    // For customers: include only their own messages.
    const messages = await Message.find(messageFilter)
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 });

    // Group into conversations by the partner (the user who is NOT the current user)
    const conversations = {};

    messages.forEach((msg) => {
      let partner;

      if (isSupportUser) {
        const participants = [msg.senderId, msg.recipientId].filter(
          (participant) => participant && participant._id
        );

        partner = participants.find((participant) => participant.role === 'customer');
      } else {
        const isSenderMe = msg.senderId._id.toString() === userId;
        partner = isSenderMe ? msg.recipientId : msg.senderId;
      }

      // Skip if there's no partner (e.g. system messages/deleted users)
      if (!partner || !partner._id) return;

      const partnerId = partner._id.toString();

      if (!conversations[partnerId]) {
        conversations[partnerId] = {
          partnerId: partner._id,
          partnerName: partner.name,
          partnerRole: partner.role,
          messages: [],
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        };
      }

      // Reverse so messages are in chronological order within the thread
      conversations[partnerId].messages.unshift(msg);

      // Support users count unread customer messages. Customers count unread direct messages.
      if (isSupportUser && !msg.read && msg.senderRole === 'customer') {
        conversations[partnerId].unreadCount += 1;
      } else if (!isSupportUser && !msg.read && msg.recipientId?._id?.toString() === userId) {
        conversations[partnerId].unreadCount += 1;
      }
    });

    // Final sort: newest conversation update at the top
    const result = Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );

    return res.json({
      message: 'Conversations retrieved successfully',
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

// Reply to a message
const replyToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Get original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const rootThreadId = originalMessage.threadId || originalMessage._id;
    const senderIdString = senderId.toString();
    const originalSenderIdString = originalMessage.senderId.toString();

    // Reply should always target the other participant in the thread.
    const replyRecipientId = senderIdString === originalSenderIdString
      ? originalMessage.recipientId
      : originalMessage.senderId;

    if (!replyRecipientId) {
      return res.status(400).json({ message: 'Cannot determine reply recipient for this message' });
    }

    // Create reply
    const reply = await Message.create({
      senderId,
      senderRole,
      recipientId: replyRecipientId,
      subject: `Re: ${originalMessage.subject}`,
      content,
      threadId: rootThreadId,
      isReply: true
    });

    const populatedReply = await reply.populate('senderId', 'name email role');

    return res.status(201).json({
      message: 'Reply sent successfully',
      data: populatedReply
    });
  } catch (error) {
    return next(error);
  }
};

// Mark message as read
const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    ).populate('senderId', 'name email role');

    return res.json({
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    return next(error);
  }
};

// Get message thread
const getMessageThread = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const rootThreadId = message.threadId || message._id;

    // Find all messages in the thread
    const threadMessages = await Message.find({
      $or: [
        { _id: rootThreadId },
        { threadId: rootThreadId }
      ]
    })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 });

    return res.json({
      message: 'Message thread retrieved successfully',
      data: threadMessages
    });
  } catch (error) {
    return next(error);
  }
};

// Delete message
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender to delete
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Cannot delete others messages' });
    }

    await Message.findByIdAndDelete(messageId);

    return res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    return next(error);
  }
};

// Update message content/subject
const updateMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { subject, content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Cannot edit others messages' });
    }

    const updates = {
      content: content.trim()
    };

    if (typeof subject === 'string' && subject.trim()) {
      updates.subject = subject.trim();
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      updates,
      { new: true }
    )
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role');

    return res.json({
      message: 'Message updated successfully',
      data: updated
    });
  } catch (error) {
    return next(error);
  }
};

// Delete all messages in a conversation with one partner
const deleteConversation = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user.id;

    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID is required' });
    }

    const result = await Message.deleteMany({
      $or: [
        { senderId: userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: userId }
      ]
    });

    return res.json({
      message: 'Conversation deleted successfully',
      deletedCount: result.deletedCount || 0
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
  replyToMessage,
  markAsRead,
  getMessageThread,
  deleteMessage,
  updateMessage,
  deleteConversation
};
