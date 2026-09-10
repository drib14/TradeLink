/**
 * TradeLink Platform Constants
 * Centralized Single Source of Truth
 */

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

const ROLES = ['student', 'admin'];

const TRADE_MODES = ['buy_sell', 'swap', 'free_donation'];

const CONDITIONS = [
  'Brand New',
  'Like New',
  'Gently Used',
  'Fair / Academic Usable'
];

const CATEGORIES = [
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

const URGENCIES = ['Immediate / Urgent', 'This Week', 'Flexible'];

const NOTIFICATION_TYPES = [
  'swap',
  'meetup',
  'price_drop',
  'wanted_response',
  'message',
  'system'
];

const DISPUTE_ACTIONS = ['refund', 'warning', 'dismissed', 'ban'];
const DISPUTE_STATUSES = ['pending', 'resolved', 'dismissed'];

const VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'];

module.exports = {
  CAMPUSES,
  ROLES,
  TRADE_MODES,
  CONDITIONS,
  CATEGORIES,
  URGENCIES,
  NOTIFICATION_TYPES,
  DISPUTE_ACTIONS,
  DISPUTE_STATUSES,
  VERIFICATION_STATUSES
};
