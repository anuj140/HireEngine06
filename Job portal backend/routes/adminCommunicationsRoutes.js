const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authentication');
const { getBroadcasts, createBroadcast } = require('../controllers/adminCommunicationsController');

// All routes require admin authentication
router.use(authMiddleware, authorize('admin'));

router.route('/broadcasts')
    .get(getBroadcasts)
    .post(createBroadcast);

module.exports = router;
