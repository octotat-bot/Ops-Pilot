const express = require('express');
const activityController = require('../controllers/activityController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/', activityController.getRecentActivity);

module.exports = router;
