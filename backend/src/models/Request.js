const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Request must belong to a user']
    },
    template: {
        type: mongoose.Schema.ObjectId,
        ref: 'Template',
        required: [true, 'Request must look up to a template']
    },
    templateSnapshot: {
        type: Object, 
        required: true
    },
    formData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'escalated', 'overdue'],
        default: 'pending' 
    },
    currentStageIndex: {
        type: Number,
        default: 0
    },
    isSlaBreached: {
        type: Boolean,
        default: false
    },
    slaDeadline: {
        type: Date
    }
}, { timestamps: true });

// Calculate SLA deadline before saving
requestSchema.pre('save', function(next) {
    if (this.isNew && this.templateSnapshot?.slaHours) {
        const deadline = new Date(this.createdAt || Date.now());
        deadline.setHours(deadline.getHours() + this.templateSnapshot.slaHours);
        this.slaDeadline = deadline;
    }
    next();
});

// Add indexes for frequently queried fields
requestSchema.index({ requester: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ template: 1 });
requestSchema.index({ isSlaBreached: 1, status: 1 });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
