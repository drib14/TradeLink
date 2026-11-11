const { v4: uuidv4 } = require('uuid');

const SEED_CATEGORIES = [
  'Electronics & Gadgets',
  'Textbooks & Reviewers',
  'Uniforms & Apparel',
  'Calculators & Electronics',
  'Fashion & Sneakers',
  'Music & Instruments',
  'Audio & Gadgets',
  'Dorm & Living',
  'Gaming & Tech',
  'Medical Equipment',
  'Junior High School Books & Reviewers',
  'Senior High Reviewers & Books',
  'General Supplies'
];

/**
 * Migration: Create categories table and seed existing categories
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('categories');
  if (!hasTable) {
    await knex.schema.createTable('categories', (table) => {
      table.string('id', 36).primary();
      table.string('name', 100).notNullable().unique();
      table.string('slug', 100).notNullable();
      table.string('icon', 50).nullable();
      table.integer('display_order').defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.string('created_by', 36).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index(['slug'], 'idx_categories_slug');
      table.index(['display_order'], 'idx_categories_display_order');
      table.index(['is_active'], 'idx_categories_is_active');
    });
  }

  // Collect distinct categories from existing listings
  const existingListingsCats = await knex('listings')
    .distinct('category')
    .whereNotNull('category')
    .pluck('category')
    .catch(() => []);

  // Merge seed categories with any existing listing categories
  const allCategoryNames = Array.from(new Set([
    ...SEED_CATEGORIES,
    ...existingListingsCats.map(c => (c || '').trim()).filter(Boolean)
  ]));

  // Seed categories
  for (let i = 0; i < allCategoryNames.length; i++) {
    const catName = allCategoryNames[i];
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const existing = await knex('categories')
      .whereRaw('LOWER(name) = ?', [catName.toLowerCase()])
      .first();

    if (!existing) {
      await knex('categories').insert({
        id: uuidv4(),
        name: catName,
        slug: slug || 'general',
        icon: null,
        display_order: i + 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('categories');
};

