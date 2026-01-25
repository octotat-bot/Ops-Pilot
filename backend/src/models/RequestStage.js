const mongoose = require('mongoose');

const requestStageSchema = new mongoose.Schema({
    request: {
        type: mongoose.Schema.ObjectId,
        ref: 'Request',
        required: true
    },
    stageIndex: {
        type: Number,
        required: true
    },
    stageName: String, 
    assignedToUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'skipped'],
        default: 'pending'
    },
    actionDate: Date,
    comments: String
}, { timestamps: true });

// Indexes for performance
requestStageSchema.index({ request: 1 });
requestStageSchema.index({ assignedToUser: 1, status: 1 });
requestStageSchema.index({ createdAt: -1 });

const RequestStage = mongoose.model('RequestStage', requestStageSchema);
module.exports = RequestStage;
