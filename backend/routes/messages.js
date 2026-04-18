// routes/messages.js
const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getConversationList } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getConversationList).post(sendMessage);
router.get('/:userId', getConversation);

module.exports = router;
