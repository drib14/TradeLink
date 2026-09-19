const Joi = require('joi');

const CAMPUSES = [
  'UC Main',
  'UC Banilad',
  'UC LM',
  'UC METC',
  'UC Pardo-Talisay',
  'UC South Campus',
  'UC Medical Center',
  'UC PRI'
];

const URGENCIES = [
  'immediate',
  'this_week',
  'flexible',
  'Immediate / Urgent',
  'This Week',
  'Flexible'
];

const createFlashRequestSchema = Joi.object({
  itemTitle: Joi.string().trim().min(3).max(200),
  itemName: Joi.string().trim().min(3).max(200),
  category: Joi.string().trim().min(2).max(100).required(),
  targetBudget: Joi.number().min(0).default(0),
  budgetRange: Joi.string().trim().max(50).allow('', null),
  urgency: Joi.string().valid(...URGENCIES).required(),
  description: Joi.string().trim().min(5).max(2000),
  notes: Joi.string().trim().min(5).max(2000),
  preferredCampus: Joi.string().valid(...CAMPUSES),
  targetCampus: Joi.string().valid(...CAMPUSES)
}).or('itemTitle', 'itemName');

module.exports = {
  createFlashRequestSchema,
  createWantedSchema: createFlashRequestSchema
};
