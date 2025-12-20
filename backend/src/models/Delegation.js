const mongoose = require('mongoose');

const delegationSchema = new mongoose.Schema({
    delegator: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Delegation must have a delegator']
    },
    delegate: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Delegation must have a delegate']
    },
    startDate: {
        type: Date,
        required: [true, 'Delegation must have a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Delegation must have an end date']
    },
    reason: {
        type: String,
        required: [true, 'Delegation must have a reason']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    scope: {
        type: String,
        enum: ['all', 'specific_templates'],
        default: 'all'
    },
    templates: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Template'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

delegationSchema.index({ delegator: 1, isActive: 1 });
delegationSchema.index({ delegate: 1, isActive: 1 });
delegationSchema.index({ startDate: 1, endDate: 1 });

delegationSchema.virtual('isCurrentlyActive').get(function () {
    const now = new Date();
    return this.isActive && this.startDate <= now && this.endDate >= now;
});

delegationSchema.methods.coversTemplate = function (templateId) {
    if (this.scope === 'all') return true;
    return this.templates.some(t => t.toString() === templateId.toString());
};

const Delegation = mongoose.model('Delegation', delegationSchema);
module.exports = Delegation;
