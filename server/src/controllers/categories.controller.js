
const db = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all active categories ordered by display_order
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await db('categories')
    .where({ is_active: true })
    .orderBy('display_order', 'asc')
    .orderBy('name', 'asc');

  res.status(200).json({
    status: 'success',
    data: {
      categories
    }
  });
});

/**
 * Create a new category (authenticated users)
 */
const createCategory = asyncHandler(async (req, res, next) => {
  const rawName = (req.body.name || '').trim();
  if (!rawName || rawName.length < 2) {
    return next(new AppError('Category name must be at least 2 characters long.', 400));
  }

  // Check if exists case-insensitively
  const existing = await db('categories')
    .whereRaw('LOWER(name) = ?', [rawName.toLowerCase()])
    .first();

  if (existing) {
    return res.status(200).json({
      status: 'success',
      message: 'Category already exists.',
      data: {
        category: existing
      }
    });
  }

  const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
  const highestOrder = await db('categories').max('display_order as maxOrder').first();
  const nextOrder = (highestOrder?.maxOrder || 0) + 1;

  const newCategory = {
    id: require('crypto').randomUUID(),
    name: rawName,
    slug,
    icon: req.body.icon || null,
    display_order: nextOrder,
    is_active: true,
    created_by: req.user ? req.user.id : null,
    created_at: new Date(),
    updated_at: new Date()
  };

  await db('categories').insert(newCategory);

  res.status(201).json({
    status: 'success',
    message: 'Category created successfully.',
    data: {
      category: newCategory
    }
  });
});

/**
 * Automatically persists a category to the DB if it does not yet exist.
 * Used when users specify new categories in listings or flash requests.
 */
async function ensureCategoryExists(rawName, userId = null) {
  if (!rawName || typeof rawName !== 'string') return null;
  const trimmed = rawName.trim();
  if (trimmed.length < 2 || trimmed.toLowerCase() === 'all' || trimmed.toLowerCase() === 'other') return null;

  try {
    const existing = await db('categories')
      .whereRaw('LOWER(name) = ?', [trimmed.toLowerCase()])
      .first();

    if (existing) return existing;

    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
    const highestOrder = await db('categories').max('display_order as maxOrder').first();
    const nextOrder = (highestOrder?.maxOrder || 0) + 1;

    const newCategory = {
      id: require('crypto').randomUUID(),
      name: trimmed,
      slug,
      icon: null,
      display_order: nextOrder,
      is_active: true,
      created_by: userId || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('categories').insert(newCategory);
    return newCategory;
  } catch (err) {
    return await db('categories').whereRaw('LOWER(name) = ?', [trimmed.toLowerCase()]).first().catch(() => null);
  }
}

module.exports = {
  getCategories,
  createCategory,
  ensureCategoryExists
};

