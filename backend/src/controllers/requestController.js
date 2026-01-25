const Request = require('../models/Request');
const RequestStage = require('../models/RequestStage');
const Template = require('../models/Template');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Notification = require('../models/Notification');
const { createActivity } = require('./activityController');
const { getActiveDelegation } = require('./delegationController');

exports.createRequest = catchAsync(async (req, res, next) => {
    const { templateId, formData } = req.body;

    const template = await Template.findById(templateId);
    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    const newRequest = await Request.create({
        requester: req.user._id,
        template: templateId,
        templateSnapshot: template.toObject(), 
        formData,
        status: 'pending'
    });

    // Validate approval flow exists
    if (!template.approvalFlow || template.approvalFlow.length === 0) {
        return next(new AppError('Template has no approval flow configured. Please contact an administrator.', 400));
    }

    const sortedFlow = template.approvalFlow.sort((a, b) => a.stageOrder - b.stageOrder);
    const firstFlowStep = sortedFlow[0];

    let assignedUserId = null;

    if (firstFlowStep) {
        if (firstFlowStep.specificApprover) {
            assignedUserId = firstFlowStep.specificApprover;
        } else if (firstFlowStep.roleRequired === 'Manager') {
            
            if (req.user.role === 'manager') {
                const User = require('../models/User');
                const admins = await User.find({ role: 'admin' });
                if (admins.length > 0) {
                    const randomIndex = Math.floor(Math.random() * admins.length);
                    assignedUserId = admins[randomIndex]._id;
                } else {
                    return next(new AppError('No admins available to approve manager requests', 400));
                }
            } else {

                if (req.user.manager) {
                    assignedUserId = req.user.manager;
                } else {
                    
                    const User = require('../models/User');
                    const managers = await User.find({
                        role: 'manager',
                        _id: { $ne: req.user._id } 
                    });

                    if (managers.length > 0) {
                        const randomIndex = Math.floor(Math.random() * managers.length);
                        assignedUserId = managers[randomIndex]._id;
                    } else {
                        
                        const admins = await User.find({ role: 'admin' });
                        if (admins.length > 0) {
                            const randomIndex = Math.floor(Math.random() * admins.length);
                            assignedUserId = admins[randomIndex]._id;
                        } else {
                            
                            return next(new AppError('No suitable approver found (No Manager or Admin in system). Please contact support.', 400));
                        }
                    }
                }
            }
        } else if (firstFlowStep.roleRequired === 'Admin') {
            
            const User = require('../models/User');
            const admins = await User.find({ role: 'admin' });
            if (admins.length > 0) {
                const randomIndex = Math.floor(Math.random() * admins.length);
                assignedUserId = admins[randomIndex]._id;
            } else {
                return next(new AppError('No admins available', 400));
            }
        }

        if (assignedUserId) {
            const delegation = await getActiveDelegation(assignedUserId, templateId);
            if (delegation) {
                assignedUserId = delegation.delegate._id;

                await createActivity(
                    'request_delegated',
                    `Request auto-assigned to ${delegation.delegate.name} (delegated from original approver)`,
                    { user: req.user._id, request: newRequest._id }
                );
            }
        }
    }

    await RequestStage.create({
        request: newRequest._id,
        stageIndex: 0,
        stageName: firstFlowStep ? firstFlowStep.roleRequired : 'Initial Approval',
        assignedToUser: assignedUserId,
        status: 'pending'
    });

    if (assignedUserId) {
        await Notification.create({
            user: assignedUserId,
            type: 'approval_needed',
            message: `New request from ${req.user.name} requires your approval.`,
            referenceId: newRequest._id
        });
    }

    await createActivity(
        'request_created',
        `${req.user.name} created a new ${template.title} request`,
        { user: req.user._id, request: newRequest._id }
    );

    res.status(201).json({
        status: 'success',
        data: {
            request: newRequest
        }
    });
});

exports.getAllRequests = catchAsync(async (req, res, next) => {
    
    const requests = await Request.find()
        .populate('template', 'title')
        .populate('requester', 'name department')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: requests.length,
        data: {
            requests
        }
    });
});

exports.searchRequests = catchAsync(async (req, res, next) => {
    const { q } = req.query; 

    if (!q || q.trim().length < 2) {
        return res.status(200).json({
            status: 'success',
            results: 0,
            data: { requests: [] }
        });
    }

    const searchTerm = q.trim();

    // Build search query - only include _id search if it's a valid ObjectId
    const searchConditions = [
        { status: new RegExp(searchTerm, 'i') }
    ];
    
    // Only search by _id if the search term is a valid ObjectId format
    if (searchTerm.match(/^[0-9a-fA-F]{24}$/)) {
        searchConditions.push({ _id: searchTerm });
    }

    const searchQuery = { $or: searchConditions };

    let requests = await Request.find(searchQuery)
        .populate('template', 'title')
        .populate('requester', 'name email')
        .limit(10)
        .sort('-createdAt');

    const nameSearch = await Request.find()
        .populate({
            path: 'requester',
            match: { name: new RegExp(searchTerm, 'i') }
        })
        .populate('template', 'title')
        .limit(10)
        .sort('-createdAt');

    const templateSearch = await Request.find()
        .populate({
            path: 'template',
            match: { title: new RegExp(searchTerm, 'i') }
        })
        .populate('requester', 'name email')
        .limit(10)
        .sort('-createdAt');

    const allResults = [...requests, ...nameSearch, ...templateSearch];
    const uniqueRequests = Array.from(
        new Map(allResults.map(r => [r._id.toString(), r])).values()
    ).filter(r => r.requester && r.template).slice(0, 10);

    res.status(200).json({
        status: 'success',
        results: uniqueRequests.length,
        data: {
            requests: uniqueRequests
        }
    });
});

exports.getMyRequests = catchAsync(async (req, res, next) => {
    const requests = await Request.find({ requester: req.user._id })
        .populate('template', 'title')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: requests.length,
        data: {
            requests
        }
    });
});

exports.getRequest = catchAsync(async (req, res, next) => {
    const request = await Request.findById(req.params.id)
        .populate('template')
        .populate('requester', 'name email department');

    if (!request) {
        return next(new AppError('Request not found', 404));
    }

    const stages = await RequestStage.find({ request: request._id }).populate('assignedToUser', 'name email');

    const isRequester = request.requester._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    const isApprover = stages.some(stage => stage.assignedToUser && stage.assignedToUser._id.equals(req.user._id));

    if (!isRequester && !isAdmin && !isApprover) {
        return next(new AppError('You do not have permission to view this request', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            request,
            stages
        }
    });
});
