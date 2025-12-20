const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A template must have a title'],
        unique: true
    },
    description: String,
    formSchema: {
        type: Object, 
        required: [true, 'A template must have a form schema']
    },
    approvalFlow: [
        {
            stageOrder: Number,
            roleRequired: {
                type: String,
                default: 'Manager' 
            },
            specificApprover: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            } 
        }
    ],
    slaHours: {
        type: Number,
        default: 24
    },
    accessLevel: {
        type: String,
        enum: ['all', 'manager', 'employee'],
        default: 'all'
    },
    category: {
        type: String,
        enum: ['HR', 'IT', 'Finance', 'Operations', 'Facilities', 'Other'],
        default: 'Other'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    currentVersion: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);
module.exports = Template;
