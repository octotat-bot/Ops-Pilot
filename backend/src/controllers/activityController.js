
const Activity = require('../models/Activity');
const Request = require('../models/Request');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.getRecentActivity = catchAsync(async (req, res, next) => {
    const { limit = 20 } = req.query;

    let filter = {};

    if (req.user.role !== 'admin') {
        // Build conditions for visibility
        const visibilityConditions = [
            { user: req.user._id } // Always see own actions
        ];

        // 1. See actions on requests created by me:
        const myRequestIds = await Request.find({ requester: req.user._id }).distinct('_id');

        // 2. If Manager, see requests from my department:
        let teamRequestIds = [];
        if (req.user.role === 'manager' && req.user.department) {
            const teamUserIds = await User.find({ department: req.user.department }).distinct('_id');
            teamRequestIds = await Request.find({ requester: { $in: teamUserIds } }).distinct('_id');
        }

        const allRelevantRequestIds = [...myRequestIds, ...teamRequestIds];

        if (allRelevantRequestIds.length > 0) {
            visibilityConditions.push({ request: { $in: allRelevantRequestIds } });
        }

        filter = { $or: visibilityConditions };
    }

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
