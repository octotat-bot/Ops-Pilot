const cron = require('node-cron');
const Request = require('../models/Request');
const Template = require('../models/Template');
const Notification = require('../models/Notification');
const User = require('../models/User');

const checkSLA = async () => {
    console.log('Running SLA Check...');

    const activeRequests = await Request.find({
        status: 'pending',
        isSlaBreached: false
    }).populate('template');

    for (const req of activeRequests) {
        
        const slaHours = req.template.slaHours;
        const enteredAt = new Date(req.createdAt); 
        const now = new Date();

        const diffMs = now - enteredAt;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > slaHours) {
            console.log(`SLA Breach detected for Request ${req._id}`);

            req.status = 'overdue';
            req.isSlaBreached = true;
            await req.save();

            const admins = await User.find({ role: 'admin' });
            const notifications = admins.map(admin => ({
                user: admin._id,
                type: 'sla_breach',
                message: `SLA Breach: Request ${req._id} has exceeded ${slaHours} hours.`,
                referenceId: req._id
            }));

            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }
    }
};

const startCron = () => {
    cron.schedule('0 * * * *', checkSLA);
    console.log('SLA Cron Job scheduled (Hourly).');
};

module.exports = startCron;
