const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/rbac');
const { chatMessageLimiter } = require('../middleware/rateLimiter');
const validateUUID = require('../middleware/validateUUID');

router.use(authenticate);

router.get('/conversations', chatController.getConversations);
router.post('/conversations', requireStudent, chatController.getOrCreateConversation);
router.get('/conversations/:id/messages', validateUUID('id'), chatController.getMessages);
router.patch('/conversations/:id/read', validateUUID('id'), chatController.markConversationAsRead);
router.post('/messages', requireStudent, chatMessageLimiter, chatController.sendMessage);

module.exports = router;
