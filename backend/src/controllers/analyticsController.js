const Request = require('../models/Request');
const RequestStage = require('../models/RequestStage');
const Template = require('../models/Template');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

exports.getAnalytics = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const requests = await Request.find({ createdAt: { $gte: daysAgo } });

    const volumeByDate = {};
    const statusByDate = {};

    requests.forEach(req => {
        const date = req.createdAt.toISOString().split('T')[0];
        volumeByDate[date] = (volumeByDate[date] || 0) + 1;

        if (!statusByDate[date]) {
            statusByDate[date] = { approved: 0, rejected: 0, pending: 0, escalated: 0 };
        }
        statusByDate[date][req.status] = (statusByDate[date][req.status] || 0) + 1;
    });

    const completedRequests = await Request.find({
        status: { $in: ['approved', 'rejected'] },
        createdAt: { $gte: daysAgo }
    });

    const approvalTimes = completedRequests.map(req => {
        const created = new Date(req.createdAt);
        const updated = new Date(req.updatedAt);
        return (updated - created) / (1000 * 60 * 60); 
    });

    const avgApprovalTime = approvalTimes.length > 0
        ? approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
        : 0;

    // Count requests by requester
    const requesterCounts = {};
    requests.forEach(req => {
        const requesterId = req.requester?._id?.toString() || req.requester?.toString();
        if (requesterId) {
            requesterCounts[requesterId] = (requesterCounts[requesterId] || 0) + 1;
        }
    });

    // Get top 5 requester IDs
    const topRequesterEntries = Object.entries(requesterCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Batch fetch all top requesters in one query
    const topRequesterIds = topRequesterEntries.map(([id]) => id);
    const topRequesterUsers = await User.find({ _id: { $in: topRequesterIds } }).select('name email');
    const userMap = new Map(topRequesterUsers.map(u => [u._id.toString(), u]));
    
    const topRequesters = topRequesterEntries.map(([userId, count]) => ({
        user: userMap.get(userId)?.name || 'Unknown',
        count
    }));

    // Count requests by template
    const templateCounts = {};
    requests.forEach(req => {
        const templateId = req.template?._id?.toString() || req.template?.toString();
        if (templateId) {
            templateCounts[templateId] = (templateCounts[templateId] || 0) + 1;
        }
    });

    // Batch fetch all templates in one query
    const templateIds = Object.keys(templateCounts);
    const templatesData = await Template.find({ _id: { $in: templateIds } }).select('title');
    const templateMap = new Map(templatesData.map(t => [t._id.toString(), t]));

    const templateUsage = Object.entries(templateCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([templateId, count]) => ({
            template: templateMap.get(templateId)?.title || 'Unknown',
            count
        }));

    const totalRequests = requests.length;
    const slaBreached = requests.filter(req => req.isSlaBreached).length;
    const slaCompliance = totalRequests > 0
        ? ((totalRequests - slaBreached) / totalRequests) * 100
        : 100;

    const statusDistribution = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        escalated: requests.filter(r => r.status === 'escalated').length,
        overdue: requests.filter(r => r.status === 'overdue').length
    };

    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;
    const processedCount = approvedCount + rejectedCount;
    const approvalRate = processedCount > 0
        ? (approvedCount / processedCount) * 100
        : 0;

    const totalUsers = await User.countDocuments();

    res.status(200).json({
        status: 'success',
        data: {
            analytics: {
                period: { days: parseInt(days), from: daysAgo, to: new Date() },
                volumeByDate,
                statusByDate,
                avgApprovalTime: Math.round(avgApprovalTime * 10) / 10,
                topRequesters,
                templateUsage,
                slaCompliance: Math.round(slaCompliance * 10) / 10,
                statusDistribution,
                approvalRate: Math.round(approvalRate * 10) / 10,
                totalRequests,
                totalUsers,
                slaBreached,
                slaBreachCount: slaBreached  // alias for admin dashboard
            }
        }
    });
});

exports.getBottleneckAnalysis = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const stages = await RequestStage.find({
        createdAt: { $gte: daysAgo },
        status: { $in: ['approved', 'rejected'] }
    }).populate('assignedToUser', 'name email role');

    const stageMetrics = {};

    stages.forEach(stage => {
        const approverName = stage.assignedToUser?.name || 'Unknown';
        const approverRole = stage.assignedToUser?.role || 'Unknown';
        const key = `${approverRole}`;

        if (!stageMetrics[key]) {
            stageMetrics[key] = {
                role: approverRole,
                totalTime: 0,
                count: 0,
                approvedCount: 0,
                rejectedCount: 0,
                approvers: new Set()
            };
        }

        if (stage.actionDate) {
            const timeSpent = (new Date(stage.actionDate) - new Date(stage.createdAt)) / (1000 * 60 * 60); 
            stageMetrics[key].totalTime += timeSpent;
            stageMetrics[key].count += 1;
        }

        if (stage.status === 'approved') stageMetrics[key].approvedCount += 1;
        if (stage.status === 'rejected') stageMetrics[key].rejectedCount += 1;
        stageMetrics[key].approvers.add(approverName);
    });

    const bottlenecks = Object.values(stageMetrics).map(metric => ({
        role: metric.role,
        avgTimeHours: metric.count > 0 ? Math.round((metric.totalTime / metric.count) * 10) / 10 : 0,
        totalRequests: metric.count,
        approvedCount: metric.approvedCount,
        rejectedCount: metric.rejectedCount,
        approvalRate: metric.count > 0 ? Math.round((metric.approvedCount / metric.count) * 100 * 10) / 10 : 0,
        uniqueApprovers: metric.approvers.size
    })).sort((a, b) => b.avgTimeHours - a.avgTimeHours);

    res.status(200).json({
        status: 'success',
        data: {
            bottlenecks,
            period: { days: parseInt(days), from: daysAgo, to: new Date() }
        }
    });
});

exports.getApproverPerformance = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const stages = await RequestStage.find({
        createdAt: { $gte: daysAgo },
        status: { $in: ['approved', 'rejected'] },
        actionDate: { $exists: true }
    }).populate('assignedToUser', 'name email role');

    const approverMetrics = {};

    stages.forEach(stage => {
        const approverId = stage.assignedToUser?._id?.toString();
        if (!approverId) return;

        if (!approverMetrics[approverId]) {
            approverMetrics[approverId] = {
                approver: stage.assignedToUser.name,
                email: stage.assignedToUser.email,
                role: stage.assignedToUser.role,
                totalApprovals: 0,
                totalRejections: 0,
                totalTime: 0,
                count: 0,
                responseTimes: []
            };
        }

        const timeSpent = (new Date(stage.actionDate) - new Date(stage.createdAt)) / (1000 * 60 * 60); 
        approverMetrics[approverId].totalTime += timeSpent;
        approverMetrics[approverId].responseTimes.push(timeSpent);
        approverMetrics[approverId].count += 1;

        if (stage.status === 'approved') approverMetrics[approverId].totalApprovals += 1;
        if (stage.status === 'rejected') approverMetrics[approverId].totalRejections += 1;
    });

    const performance = Object.values(approverMetrics).map(metric => {
        const avgResponseTime = metric.count > 0 ? metric.totalTime / metric.count : 0;
        const approvalRate = metric.count > 0 ? (metric.totalApprovals / metric.count) * 100 : 0;

        const sorted = metric.responseTimes.sort((a, b) => a - b);
        const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;

        return {
            approver: metric.approver,
            email: metric.email,
            role: metric.role,
            totalProcessed: metric.count,
            totalApprovals: metric.totalApprovals,
            totalRejections: metric.totalRejections,
            approvalRate: Math.round(approvalRate * 10) / 10,
            avgResponseTimeHours: Math.round(avgResponseTime * 10) / 10,
            medianResponseTimeHours: Math.round(median * 10) / 10,
            efficiency: metric.count 
        };
    }).sort((a, b) => b.totalProcessed - a.totalProcessed);

    res.status(200).json({
        status: 'success',
        data: {
            performance,
            period: { days: parseInt(days), from: daysAgo, to: new Date() }
        }
    });
});

exports.getTemplateStatistics = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const requests = await Request.find({ createdAt: { $gte: daysAgo } }).populate('template', 'title slaHours');

    const templateMetrics = {};

    requests.forEach(req => {
        const templateId = req.template?._id?.toString();
        if (!templateId) return;

        if (!templateMetrics[templateId]) {
            templateMetrics[templateId] = {
                template: req.template.title,
                slaHours: req.template.slaHours,
                totalRequests: 0,
                approved: 0,
                rejected: 0,
                pending: 0,
                escalated: 0,
                slaBreached: 0,
                totalProcessingTime: 0,
                completedCount: 0
            };
        }

        templateMetrics[templateId].totalRequests += 1;
        templateMetrics[templateId][req.status] = (templateMetrics[templateId][req.status] || 0) + 1;

        if (req.isSlaBreached) templateMetrics[templateId].slaBreached += 1;

        if (req.status === 'approved' || req.status === 'rejected') {
            const processingTime = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60);
            templateMetrics[templateId].totalProcessingTime += processingTime;
            templateMetrics[templateId].completedCount += 1;
        }
    });

    const statistics = Object.values(templateMetrics).map(metric => ({
        template: metric.template,
        slaHours: metric.slaHours,
        totalRequests: metric.totalRequests,
        approved: metric.approved,
        rejected: metric.rejected,
        pending: metric.pending,
        escalated: metric.escalated,
        approvalRate: metric.totalRequests > 0 ? Math.round((metric.approved / metric.totalRequests) * 100 * 10) / 10 : 0,
        slaComplianceRate: metric.totalRequests > 0 ? Math.round(((metric.totalRequests - metric.slaBreached) / metric.totalRequests) * 100 * 10) / 10 : 100,
        avgProcessingTimeHours: metric.completedCount > 0 ? Math.round((metric.totalProcessingTime / metric.completedCount) * 10) / 10 : 0,
        popularity: metric.totalRequests 
    })).sort((a, b) => b.totalRequests - a.totalRequests);

    res.status(200).json({
        status: 'success',
        data: {
            statistics,
            period: { days: parseInt(days), from: daysAgo, to: new Date() }
        }
    });
});

exports.getSLACompliance = catchAsync(async (req, res, next) => {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const requests = await Request.find({ createdAt: { $gte: daysAgo } })
        .populate('template', 'title slaHours')
        .populate('requester', 'name email');

    const totalRequests = requests.length;
    const breachedRequests = requests.filter(r => r.isSlaBreached);
    const onTimeRequests = totalRequests - breachedRequests.length;
    const complianceRate = totalRequests > 0 ? (onTimeRequests / totalRequests) * 100 : 100;

    const slaByTemplate = {};
    requests.forEach(req => {
        const templateId = req.template?._id?.toString();
        const templateName = req.template?.title || 'Unknown';

        if (!slaByTemplate[templateId]) {
            slaByTemplate[templateId] = {
                template: templateName,
                total: 0,
                breached: 0,
                onTime: 0
            };
        }

        slaByTemplate[templateId].total += 1;
        if (req.isSlaBreached) {
            slaByTemplate[templateId].breached += 1;
        } else {
            slaByTemplate[templateId].onTime += 1;
        }
    });

    const templateCompliance = Object.values(slaByTemplate).map(metric => ({
        template: metric.template,
        total: metric.total,
        breached: metric.breached,
        onTime: metric.onTime,
        complianceRate: metric.total > 0 ? Math.round((metric.onTime / metric.total) * 100 * 10) / 10 : 100
    })).sort((a, b) => a.complianceRate - b.complianceRate); 

    const recentBreaches = breachedRequests.slice(0, 10).map(req => {
        // Calculate SLA deadline if not stored (for backward compatibility)
        const slaDeadline = req.slaDeadline || new Date(new Date(req.createdAt).getTime() + (req.template?.slaHours || 24) * 60 * 60 * 1000);
        const daysOverdue = Math.ceil((new Date() - new Date(slaDeadline)) / (1000 * 60 * 60 * 24));
        
        return {
            requestId: req._id,
            template: req.template?.title,
            requester: req.requester?.name,
            createdAt: req.createdAt,
            slaDeadline,
            status: req.status,
            daysOverdue: daysOverdue > 0 ? daysOverdue : 0
        };
    });

    res.status(200).json({
        status: 'success',
        data: {
            overall: {
                totalRequests,
                onTimeRequests,
                breachedRequests: breachedRequests.length,
                complianceRate: Math.round(complianceRate * 10) / 10
            },
            templateCompliance,
            recentBreaches,
            period: { days: parseInt(days), from: daysAgo, to: new Date() }
        }
    });
});

exports.getTrendAnalysis = catchAsync(async (req, res, next) => {
    const { days = 90 } = req.query; 
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const requests = await Request.find({ createdAt: { $gte: daysAgo } });

    const weeklyData = {};
    requests.forEach(req => {
        const weekStart = new Date(req.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); 
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                week: weekKey,
                total: 0,
                approved: 0,
                rejected: 0,
                pending: 0,
                avgProcessingTime: 0,
                processingTimes: []
            };
        }

        weeklyData[weekKey].total += 1;
        weeklyData[weekKey][req.status] = (weeklyData[weekKey][req.status] || 0) + 1;

        if (req.status === 'approved' || req.status === 'rejected') {
            const processingTime = (new Date(req.updatedAt) - new Date(req.createdAt)) / (1000 * 60 * 60);
            weeklyData[weekKey].processingTimes.push(processingTime);
        }
    });

    const weeklyTrends = Object.values(weeklyData).map(week => {
        const avgTime = week.processingTimes.length > 0
            ? week.processingTimes.reduce((a, b) => a + b, 0) / week.processingTimes.length
            : 0;

        return {
            week: week.week,
            total: week.total,
            approved: week.approved,
            rejected: week.rejected,
            pending: week.pending,
            approvalRate: week.total > 0 ? Math.round((week.approved / week.total) * 100 * 10) / 10 : 0,
            avgProcessingTimeHours: Math.round(avgTime * 10) / 10
        };
    }).sort((a, b) => new Date(a.week) - new Date(b.week));

    const firstWeek = weeklyTrends[0];
    const lastWeek = weeklyTrends[weeklyTrends.length - 1];
    const growthRate = firstWeek && lastWeek && firstWeek.total > 0
        ? ((lastWeek.total - firstWeek.total) / firstWeek.total) * 100
        : 0;

    res.status(200).json({
        status: 'success',
        data: {
            weeklyTrends,
            insights: {
                growthRate: Math.round(growthRate * 10) / 10,
                totalRequests: requests.length,
                avgWeeklyVolume: weeklyTrends.length > 0 ? Math.round(requests.length / weeklyTrends.length) : 0
            },
            period: { days: parseInt(days), from: daysAgo, to: new Date() }
        }
    });
});
