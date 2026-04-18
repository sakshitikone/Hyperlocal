// controllers/messageController.js — Chat message CRUD
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, relatedRequest } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver and content are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
      relatedRequest: relatedRequest || null,
    });

    await message.populate('sender', 'name avatar isOnline');
    await message.populate('receiver', 'name avatar isOnline');

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate('sender', 'name avatar isOnline')
      .populate('receiver', 'name avatar isOnline')
      .sort({ createdAt: 1 });

    // Mark unread messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all conversations for current user (list of chat partners)
// @route   GET /api/messages
// @access  Private
const getConversationList = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate to get unique conversation partners with last message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$sender', userId] }, '$receiver', '$sender'],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Populate user info
    const populated = await User.populate(conversations, {
      path: '_id',
      select: 'name avatar isOnline lastSeen',
    });

    res.json({ success: true, conversations: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getConversation, getConversationList };
