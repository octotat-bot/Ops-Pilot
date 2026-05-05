const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');

exports.getMyNotifications = catchAsync(async (req, res, next) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort('-createdAt')
        .limit(50);

    res.status(200).json({
        status: 'success',
        results: notifications.length,
        data: { notifications }
    });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        data: { notification }
    });
});

exports.markAllAsRead = catchAsync(async (req, res, next) => {
    await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
    });
});
