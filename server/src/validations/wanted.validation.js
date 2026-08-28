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

const URGENCIES = ['Immediate / Urgent', 'This Week', 'Flexible'];

const createWantedSchema = Joi.object({
  itemTitle: Joi.string().trim().min(3).max(200).required(),
  category: Joi.string().trim().min(2).max(100).required(),
  targetBudget: Joi.number().min(0).default(0),
  urgency: Joi.string().valid(...URGENCIES).required(),
  description: Joi.string().trim().min(10).max(2000).required(),
  preferredCampus: Joi.string().valid(...CAMPUSES).required()
});

module.exports = {
  createWantedSchema
};
