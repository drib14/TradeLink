const { v4: uuidv4 } = require('uuid');
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
    id: uuidv4(),
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

module.exports = {
  getCategories,
  createCategory
};

