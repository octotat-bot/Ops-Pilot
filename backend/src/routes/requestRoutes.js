const express = require('express');
const requestController = require('../controllers/requestController');
const approvalController = require('../controllers/approvalController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/me', requestController.getMyRequests);

router.get('/search', requestController.searchRequests);

router.get('/approvals', approvalController.getPendingApprovals);

router.post('/', requestController.createRequest);

router.get('/', authController.restrictTo('admin'), requestController.getAllRequests);

router
    .route('/:id')
    .get(requestController.getRequest); 

router.patch('/:requestId/approve', approvalController.approveStage);
router.patch('/:requestId/reject', approvalController.rejectStage);
router.patch('/:requestId/escalate', approvalController.escalateStage);

module.exports = router;
