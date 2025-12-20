const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/', analyticsController.getAnalytics);

router.get('/bottlenecks', analyticsController.getBottleneckAnalysis);
router.get('/approver-performance', analyticsController.getApproverPerformance);
router.get('/template-statistics', analyticsController.getTemplateStatistics);
router.get('/sla-compliance', analyticsController.getSLACompliance);
router.get('/trends', analyticsController.getTrendAnalysis);

module.exports = router;
