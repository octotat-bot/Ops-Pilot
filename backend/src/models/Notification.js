const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['approval_needed', 'request_update', 'sla_breach', 'escalation'],
        required: true
    },
    message: String,
    referenceId: { 
        type: mongoose.Schema.ObjectId,
        ref: 'Request'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
