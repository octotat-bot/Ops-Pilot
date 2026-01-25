const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'request_created',
            'request_approved',
            'request_rejected',
            'request_escalated',
            'request_delegated',
            'template_created',
            'template_updated',
            'template_deleted',
            'user_registered',
            'user_updated',
            'user_activated',
            'user_deactivated',
            'password_reset',
            'delegation_created',
            'delegation_deactivated'
        ],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    request: {
        type: mongoose.Schema.ObjectId,
        ref: 'Request'
    },
    template: {
        type: mongoose.Schema.ObjectId,
        ref: 'Template'
    }
}, { timestamps: true });

// Indexes for performance
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1 });
activitySchema.index({ request: 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
