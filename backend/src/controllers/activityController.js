const Activity = require('../models/Activity');
const catchAsync = require('../utils/catchAsync');

exports.getRecentActivity = catchAsync(async (req, res, next) => {
    const { limit = 20 } = req.query;

    // Filter activities: Admins see everything, others only see their own
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };

    const activities = await Activity.find(filter)
        .populate('user', 'name email')
        .populate('request', '_id')
        .populate('template', 'title')
        .sort('-createdAt')
        .limit(parseInt(limit));

    res.status(200).json({
        status: 'success',
        results: activities.length,
        data: {
            activities
        }
    });
});

exports.createActivity = async (type, message, data = {}) => {
    try {
        await Activity.create({
            type,
            message,
            ...data
        });
    } catch (err) {
        console.error('Failed to create activity:', err);
    }
};
