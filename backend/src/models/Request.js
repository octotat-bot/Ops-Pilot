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
    }
}, { timestamps: true });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
