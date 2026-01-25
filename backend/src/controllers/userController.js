const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { createActivity } = require('./activityController');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    let query = {};

    if (req.user.role === 'manager') {
        query.role = 'manager';

        query._id = { $ne: req.user._id };
    }

    const users = await User.find(query);

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found. Please verify the user ID and try again.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.updateUser = catchAsync(async (req, res, next) => {
    const { role, manager, status } = req.body;

    if (req.body.password) {
        return next(new AppError('This route is not for password updates. Please use the reset password feature.', 400));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('User not found. Please verify the user ID and try again.', 404));
    }

    if (role !== undefined) user.role = role;
    if (manager !== undefined) user.manager = manager;
    if (status !== undefined) user.status = status;

    await user.save();

    await createActivity(
        'user_updated',
        `${req.user.name} updated user ${user.name}'s profile`,
        { user: req.user._id }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.deactivateUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found. Please verify the user ID and try again.', 404));
    }

    if (user._id.toString() === req.user._id.toString()) {
        return next(new AppError('You cannot deactivate your own account. Please contact another administrator.', 400));
    }

    user.status = 'inactive';
    await user.save();

    await createActivity(
        'user_deactivated',
        `${req.user.name} deactivated user ${user.name}`,
        { user: req.user._id }
    );

    res.status(200).json({
        status: 'success',
        message: 'User deactivated successfully',
        data: {
            user
        }
    });
});

exports.activateUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found. Please verify the user ID and try again.', 404));
    }

    user.status = 'active';
    await user.save();

    await createActivity(
        'user_activated',
        `${req.user.name} activated user ${user.name}`,
        { user: req.user._id }
    );

    res.status(200).json({
        status: 'success',
        message: 'User activated successfully',
        data: {
            user
        }
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return next(new AppError('Password must be at least 8 characters long. Please choose a stronger password.', 400));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found. Please verify the user ID and try again.', 404));
    }

    user.password = newPassword;
    await user.save();

    await createActivity(
        'password_reset',
        `${req.user.name} reset password for user ${user.name}`,
        { user: req.user._id }
    );

    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully. The user can now log in with the new password.'
    });
});
