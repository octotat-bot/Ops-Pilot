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

const RequestStage = mongoose.model('RequestStage', requestStageSchema);
module.exports = RequestStage;
