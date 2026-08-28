const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all notifications for current user
 */
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await db('notifications')
    .where({ user_id: req.user.id })
    .orderBy('created_at', 'desc')
    .limit(50);

  const formatted = notifications.map((n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: Boolean(n.is_read),
    linkView: n.link_view,
    linkParams: n.link_params ? (typeof n.link_params === 'string' ? JSON.parse(n.link_params) : n.link_params) : null,
    createdAt: n.created_at
  }));

  res.status(200).json({
    status: 'success',
    data: {
      notifications: formatted
    }
  });
});

/**
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await db('notifications')
    .where({ id, user_id: req.user.id })
    .update({ is_read: true });

  res.status(200).json({
    status: 'success',
    message: 'Notification marked as read.'
  });
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await db('notifications')
    .where({ user_id: req.user.id })
    .update({ is_read: true });

  res.status(200).json({
    status: 'success',
    message: 'All notifications marked as read.'
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
