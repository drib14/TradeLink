const express = require('express');
const router = express.Router();
const meetupsController = require('../controllers/meetups.controller');
const { authenticate } = require('../middleware/auth');
const decodeParams = require('../middleware/decodeParams');
const validate = require('../middleware/validate');
const {
  scheduleMeetupSchema,
  verifyMeetupCodeSchema,
  updateMeetupStatusSchema
} = require('../validations/meetup.validation');

decodeParams.bindRouter(router);
router.use(authenticate);

router.get('/', meetupsController.getMeetups);
router.post('/', validate(scheduleMeetupSchema), meetupsController.scheduleMeetup);
router.post('/:id/verify', validate(verifyMeetupCodeSchema), meetupsController.verifyMeetupCode);
router.patch('/:id/status', validate(updateMeetupStatusSchema), meetupsController.updateMeetupStatus);

module.exports = router;
