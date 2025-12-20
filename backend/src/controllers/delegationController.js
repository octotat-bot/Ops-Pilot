const Delegation = require('../models/Delegation');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { createActivity } = require('./activityController');

exports.createDelegation = catchAsync(async (req, res, next) => {
    const { delegate, startDate, endDate, reason, scope, templates } = req.body;

    if (req.user.role !== 'manager') {
        return next(new AppError('Only managers can create delegations. Admins handle all requests directly.', 403));
    }

    if (!delegate || !startDate || !endDate || !reason) {
        return next(new AppError('Please provide delegate, start date, end date, and reason for delegation.', 400));
    }

    const delegateUser = await User.findById(delegate);
    if (!delegateUser) {
        return next(new AppError('Delegate user not found. Please select a valid user.', 404));
    }

    if (delegateUser.role !== 'manager') {
        return next(new AppError('You can only delegate to other managers. Please select a manager.', 400));
    }

    if (delegate === req.user._id.toString()) {
        return next(new AppError('You cannot delegate to yourself. Please select a different manager.', 400));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
        return next(new AppError('End date must be after start date. Please check your dates.', 400));
    }

    const overlapping = await Delegation.findOne({
        delegator: req.user._id,
        isActive: true,
        $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
    });

    if (overlapping) {
        return next(new AppError('You already have an active delegation during this period. Please deactivate it first or choose different dates.', 400));
    }

    const delegation = await Delegation.create({
        delegator: req.user._id,
        delegate,
        startDate: start,
        endDate: end,
        reason,
        scope: scope || 'all',
        templates: scope === 'specific_templates' ? templates : []
    });

    await delegation.populate('delegate', 'name email');

    await createActivity(
        'delegation_created',
        `${req.user.name} delegated approvals to ${delegateUser.name} from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
        { user: req.user._id }
    );

    res.status(201).json({
        status: 'success',
        data: {
            delegation
        }
    });
});

exports.getMyDelegations = catchAsync(async (req, res, next) => {
    const delegations = await Delegation.find({ delegator: req.user._id })
        .populate('delegate', 'name email')
        .populate('templates', 'title')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: delegations.length,
        data: {
            delegations
        }
    });
});

exports.getDelegationsToMe = catchAsync(async (req, res, next) => {
    const delegations = await Delegation.find({ delegate: req.user._id })
        .populate('delegator', 'name email')
        .populate('templates', 'title')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: delegations.length,
        data: {
            delegations
        }
    });
});

exports.deactivateDelegation = catchAsync(async (req, res, next) => {
    const delegation = await Delegation.findById(req.params.id);

    if (!delegation) {
        return next(new AppError('Delegation not found. Please verify the delegation ID.', 404));
    }

    if (delegation.delegator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError('You can only deactivate your own delegations.', 403));
    }

    delegation.isActive = false;
    await delegation.save();

    await delegation.populate('delegate', 'name email');

    await createActivity(
        'delegation_deactivated',
        `${req.user.name} deactivated delegation to ${delegation.delegate.name}`,
        { user: req.user._id }
    );

    res.status(200).json({
        status: 'success',
        message: 'Delegation deactivated successfully',
        data: {
            delegation
        }
    });
});

exports.getActiveDelegation = async (userId, templateId = null) => {
    const now = new Date();

    const query = {
        delegator: userId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
    };

    const delegations = await Delegation.find(query).populate('delegate');

    if (templateId) {
        const applicable = delegations.find(d => d.coversTemplate(templateId));
        return applicable;
    }

    return delegations.find(d => d.scope === 'all') || delegations[0];
};
