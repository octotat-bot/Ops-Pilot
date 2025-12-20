const Request = require('../models/Request');
const RequestStage = require('../models/RequestStage');
const Template = require('../models/Template');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { createActivity } = require('./activityController');

exports.getPendingApprovals = catchAsync(async (req, res, next) => {
    
    const stages = await RequestStage.find({
        assignedToUser: req.user._id,
        status: 'pending'
    }).populate({
        path: 'request',
        populate: { path: 'template requester' } 
    });

    res.status(200).json({
        status: 'success',
        results: stages.length,
        data: {
            approvals: stages
        }
    });
});

exports.approveStage = catchAsync(async (req, res, next) => {
    const { requestId } = req.params;
    const { comments } = req.body;

    const request = await Request.findById(requestId).populate('template');
    if (!request) return next(new AppError('Request not found', 404));

    if (request.status === 'approved' || request.status === 'rejected') {
        return next(new AppError('Request is terminal (approved/rejected) and cannot be modified.', 400));
    }

    const currentStage = await RequestStage.findOne({
        request: requestId,
        status: 'pending'
    });

    if (!currentStage) return next(new AppError('No pending stage found for this request', 404));

    const isAssigned = currentStage.assignedToUser && currentStage.assignedToUser.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !isAdmin) {
        return next(new AppError('You are not authorized to approve this stage', 403));
    }

    currentStage.status = 'approved';
    currentStage.actionDate = Date.now();
    currentStage.comments = comments;
    await currentStage.save();

    const templateFn = request.template.approvalFlow.sort((a, b) => a.stageOrder - b.stageOrder);
    const nextStageIndex = request.currentStageIndex + 1;

    if (nextStageIndex < templateFn.length) {
        
        const nextFlowStep = templateFn[nextStageIndex];
        let nextAssignedUser = null;

        if (nextFlowStep.specificApprover) {
            nextAssignedUser = nextFlowStep.specificApprover;
        } else if (nextFlowStep.roleRequired === 'Manager') {
            await request.populate('requester');
            nextAssignedUser = request.requester.manager;
        }

        await RequestStage.create({
            request: requestId,
            stageIndex: nextStageIndex,
            stageName: nextFlowStep.roleRequired,
            assignedToUser: nextAssignedUser,
            status: 'pending'
        });

        request.currentStageIndex = nextStageIndex;

        if (request.status === 'overdue') {

            request.status = 'pending';
        } else {
            request.status = 'pending';
        }
        await request.save();

        if (nextAssignedUser) {
            await Notification.create({
                user: nextAssignedUser,
                type: 'approval_needed',
                message: `Request from ${request.requester.name || 'User'} moved to next stage: ${nextFlowStep.roleRequired}`,
                referenceId: request._id
            });
        }

    } else {
        
        request.status = 'approved';
        await request.save();

        await Notification.create({
            user: request.requester._id || request.requester,
            type: 'request_update',
            message: `Your request for ${request.template.title} has been APPROVED!`,
            referenceId: request._id
        });
    }

    await createActivity(
        'request_approved',
        `${req.user.name} approved request #${request._id.toString().slice(-6).toUpperCase()}`,
        { user: req.user._id, request: request._id }
    );

    res.status(200).json({
        status: 'success',
        data: {
            request,
            action: 'approved'
        }
    });
});

exports.rejectStage = catchAsync(async (req, res, next) => {
    
    const { requestId } = req.params;
    const { comments } = req.body;

    const request = await Request.findById(requestId);
    if (!request) return next(new AppError('Request not found', 404));

    const currentStage = await RequestStage.findOne({ request: requestId, status: 'pending' });
    if (!currentStage) return next(new AppError('No pending stage found', 404));

    const isAssigned = currentStage.assignedToUser && currentStage.assignedToUser.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) return next(new AppError('Unauthorized', 403));

    currentStage.status = 'rejected';
    currentStage.actionDate = Date.now();
    currentStage.comments = comments;
    await currentStage.save();

    request.status = 'rejected';
    await request.save();

    await createActivity(
        'request_rejected',
        `${req.user.name} rejected request #${request._id.toString().slice(-6).toUpperCase()}`,
        { user: req.user._id, request: request._id }
    );

    res.status(200).json({ status: 'success', data: { request, action: 'rejected' } });
});

exports.escalateStage = catchAsync(async (req, res, next) => {
    const { requestId } = req.params;
    const { comments } = req.body; 

    const request = await Request.findById(requestId).populate('template');
    if (!request) return next(new AppError('Request not found', 404));

    const currentStage = await RequestStage.findOne({ request: requestId, status: 'pending' });
    if (!currentStage) return next(new AppError('No pending stage found', 404));

    if (!currentStage.assignedToUser.equals(req.user._id)) {
        return next(new AppError('You can only escalate requests assigned to you', 403));
    }

    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    if (admins.length === 0) {
        return next(new AppError('No admins available to escalate to', 500));
    }
    const randomAdmin = admins[Math.floor(Math.random() * admins.length)];

    currentStage.assignedToUser = randomAdmin._id;
    
    currentStage.comments = comments ? `[Escalated]: ${comments}` : '[Escalated]';

    await currentStage.save();

    request.status = 'escalated';
    await request.save();

    await Notification.create({
        user: randomAdmin._id,
        type: 'escalation',
        message: `Request ${request._id} has been ESCALATED to you by ${req.user.name}.`,
        referenceId: request._id
    });

    await createActivity(
        'request_escalated',
        `${req.user.name} escalated request #${request._id.toString().slice(-6).toUpperCase()} to ${randomAdmin.name}`,
        { user: req.user._id, request: request._id }
    );

    res.status(200).json({
        status: 'success',
        data: {
            request,
            action: 'escalated',
            assignedTo: randomAdmin.name
        }
    });
});
