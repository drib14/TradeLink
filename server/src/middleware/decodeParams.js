const { decodeId } = require('../utils/idHasher');

const ID_PARAM_KEYS = [
  'id',
  'userId',
  'user_id',
  'listingId',
  'listing_id',
  'meetupId',
  'meetup_id',
  'swapId',
  'swap_id',
  'targetId',
  'target_id',
  'verificationId',
  'disputeId'
];

function decodeParams(req, res, next) {
  if (req && req.params) {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = decodeId(req.params[key]);
      }
    }
  }
  if (typeof next === 'function') next();
}

/**
 * Automatically binds param decoders to an Express router instance
 * @param {import('express').Router} router
 */
decodeParams.bindRouter = function (router) {
  ID_PARAM_KEYS.forEach((paramName) => {
    router.param(paramName, (req, res, next, val) => {
      req.params[paramName] = decodeId(val);
      next();
    });
  });
  return router;
};

module.exports = decodeParams;
