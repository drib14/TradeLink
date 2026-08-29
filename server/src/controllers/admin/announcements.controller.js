const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { logAdminAction } = require('./verification.controller');

/**
 * Get announcements
 */
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await db('announcements').orderBy('created_at', 'desc');

  const formatted = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    message: a.message,
    campus: a.campus,
    type: a.type,
    authorName: a.author_name,
    createdAt: a.created_at,
    isActive: Boolean(a.is_active)
  }));

  res.status(200).json({
    status: 'success',
    data: { announcements: formatted }
  });
});

/**
 * Create announcement
 */
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, campus = 'All', type = 'info' } = req.body;

  const annId = `ann_${uuidv4()}`;
  const newAnn = {
    id: annId,
    title: title.trim(),
    message: message.trim(),
    campus,
    type,
    author_id: req.user.id,
    author_name: req.user.name,
    is_active: true
  };

  await db('announcements').insert(newAnn);
  await logAdminAction(req.user, 'Created Campus Announcement', 'announcement', annId, `Posted "${title}" for ${campus}`, req);

  res.status(201).json({
    status: 'success',
    message: 'Announcement published to campus bulletin.',
    data: { announcement: newAnn }
  });
});

/**
 * Delete announcement
 */
const deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  await db('announcements').where({ id }).delete();
  await logAdminAction(req.user, 'Deleted Announcement', 'announcement', id, `Deleted announcement ${id}`, req);

  res.status(200).json({
    status: 'success',
    message: 'Announcement removed.'
  });
});

/**
 * Toggle announcement active status
 */
const toggleAnnouncement = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const ann = await db('announcements').where({ id }).first();

  if (!ann) {
    return next(new AppError('Announcement not found.', 404));
  }

  await db('announcements').where({ id }).update({ is_active: !ann.is_active });

  res.status(200).json({
    status: 'success',
    message: 'Announcement visibility updated.'
  });
});

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement
};
