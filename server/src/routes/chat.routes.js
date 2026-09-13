const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations/:id/messages', chatController.getMessages);
router.patch('/conversations/:id/read', chatController.markConversationAsRead);
router.post('/messages', chatController.sendMessage);

module.exports = router;
