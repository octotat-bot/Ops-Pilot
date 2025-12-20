const express = require('express');
const delegationController = require('../controllers/delegationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/', authController.restrictTo('manager'), delegationController.createDelegation);

router.get('/my-delegations', authController.restrictTo('manager'), delegationController.getMyDelegations);

router.get('/to-me', authController.restrictTo('manager'), delegationController.getDelegationsToMe);

router.patch('/:id/deactivate', authController.restrictTo('manager'), delegationController.deactivateDelegation);

module.exports = router;
