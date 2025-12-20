const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/me', (req, res, next) => {
    req.params.id = req.user.id;
    next();
}, userController.getUser);

router.get('/', authController.restrictTo('manager', 'admin'), userController.getAllUsers);

router.use(authController.restrictTo('admin'));

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser);

router.patch('/:id/deactivate', userController.deactivateUser);
router.patch('/:id/activate', userController.activateUser);
router.patch('/:id/reset-password', userController.resetPassword);

module.exports = router;
