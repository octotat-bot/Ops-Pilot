const mongoose = require('mongoose');

const templateVersionSchema = new mongoose.Schema({
    template: {
        type: mongoose.Schema.ObjectId,
        ref: 'Template',
        required: true
    },
    versionNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    formFields: [{
        fieldName: String,
        fieldType: {
            type: String,
            enum: ['text', 'number', 'date', 'select', 'textarea']
        },
        required: Boolean,
        options: [String]
    }],
    approvalFlow: [{
        stageOrder: Number,
        stageName: String,
        roleRequired: {
            type: String,
            enum: ['Employee', 'Manager', 'Admin']
        },
        specificUser: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    }],
    slaHours: {
        type: Number,
        default: 48
    },
    changeDescription: {
        type: String,
        required: true
    },
    changedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

templateVersionSchema.index({ template: 1, versionNumber: -1 });

const TemplateVersion = mongoose.model('TemplateVersion', templateVersionSchema);
module.exports = TemplateVersion;
