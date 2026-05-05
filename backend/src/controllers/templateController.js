const Template = require('../models/Template');
const TemplateVersion = require('../models/TemplateVersion');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { createActivity } = require('./activityController');

exports.createTemplate = catchAsync(async (req, res, next) => {
    const newTemplate = await Template.create(req.body);

    await TemplateVersion.create({
        template: newTemplate._id,
        versionNumber: 1,
        title: newTemplate.title,
        description: newTemplate.description,
        formFields: newTemplate.formSchema?.fields || [],
        approvalFlow: newTemplate.approvalFlow,
        slaHours: newTemplate.slaHours,
        changeDescription: 'Initial version',
        changedBy: req.user._id
    });

    await createActivity(
        'template_created',
        `${req.user.name} created template "${newTemplate.title}"`,
        { user: req.user._id, template: newTemplate._id }
    );

    res.status(201).json({
        status: 'success',
        data: {
            template: newTemplate
        }
    });
});

exports.getAllTemplates = catchAsync(async (req, res, next) => {
    const filter = {};

    if (req.user.role === 'admin') {
        // Admin sees all templates (published + drafts)
    } else if (req.user.role === 'manager') {
        filter.isPublished = true;
        filter.accessLevel = { $in: ['all', 'manager'] };
    } else {
        // employee
        filter.isPublished = true;
        filter.accessLevel = { $in: ['all', 'employee'] };
    }

    const templates = await Template.find(filter);

    res.status(200).json({
        status: 'success',
        results: templates.length,
        data: {
            templates
        }
    });
});

exports.getTemplate = catchAsync(async (req, res, next) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
        return next(new AppError('Template not found. Please verify the template ID and try again.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            template
        }
    });
});

exports.updateTemplate = catchAsync(async (req, res, next) => {
    const { changeDescription, ...updateData } = req.body;

    if (!changeDescription) {
        return next(new AppError('Change description is required for template updates. Please describe what you changed.', 400));
    }

    const oldTemplate = await Template.findById(req.params.id);
    if (!oldTemplate) {
        return next(new AppError('Template not found. Please verify the template ID and try again.', 404));
    }

    const newVersionNumber = oldTemplate.currentVersion + 1;
    await TemplateVersion.create({
        template: oldTemplate._id,
        versionNumber: oldTemplate.currentVersion,
        title: oldTemplate.title,
        description: oldTemplate.description,
        formFields: oldTemplate.formSchema?.fields || [],
        approvalFlow: oldTemplate.approvalFlow,
        slaHours: oldTemplate.slaHours,
        changeDescription: `Version ${oldTemplate.currentVersion} (before update)`,
        changedBy: req.user._id
    });

    const template = await Template.findByIdAndUpdate(
        req.params.id,
        { ...updateData, currentVersion: newVersionNumber },
        { new: true, runValidators: true }
    );

    await TemplateVersion.create({
        template: template._id,
        versionNumber: newVersionNumber,
        title: template.title,
        description: template.description,
        formFields: template.formSchema?.fields || [],
        approvalFlow: template.approvalFlow,
        slaHours: template.slaHours,
        changeDescription,
        changedBy: req.user._id
    });

    await createActivity(
        'template_updated',
        `${req.user.name} updated template "${template.title}" to v${newVersionNumber}: ${changeDescription}`,
        { user: req.user._id, template: template._id }
    );

    res.status(200).json({
        status: 'success',
        data: {
            template,
            version: newVersionNumber
        }
    });
});

exports.getTemplateVersions = catchAsync(async (req, res, next) => {
    const versions = await TemplateVersion.find({ template: req.params.id })
        .populate('changedBy', 'name email')
        .sort('-versionNumber');

    res.status(200).json({
        status: 'success',
        results: versions.length,
        data: {
            versions
        }
    });
});

exports.revertToVersion = catchAsync(async (req, res, next) => {
    const { versionNumber } = req.params;
    const { changeDescription } = req.body;

    if (!changeDescription) {
        return next(new AppError('Change description is required. Please describe why you are reverting.', 400));
    }

    const version = await TemplateVersion.findOne({
        template: req.params.id,
        versionNumber: parseInt(versionNumber)
    });

    if (!version) {
        return next(new AppError('Version not found. Please verify the version number and try again.', 404));
    }

    const template = await Template.findById(req.params.id);
    if (!template) {
        return next(new AppError('Template not found. Please verify the template ID and try again.', 404));
    }

    const newVersionNumber = template.currentVersion + 1;
    await TemplateVersion.create({
        template: template._id,
        versionNumber: template.currentVersion,
        title: template.title,
        description: template.description,
        formFields: template.formSchema?.fields || [],
        approvalFlow: template.approvalFlow,
        slaHours: template.slaHours,
        changeDescription: `Version ${template.currentVersion} (before revert)`,
        changedBy: req.user._id
    });

    template.title = version.title;
    template.description = version.description;
    template.formSchema = { fields: version.formFields };
    template.approvalFlow = version.approvalFlow;
    template.slaHours = version.slaHours;
    template.currentVersion = newVersionNumber;
    await template.save();

    await TemplateVersion.create({
        template: template._id,
        versionNumber: newVersionNumber,
        title: version.title,
        description: version.description,
        formFields: version.formFields,
        approvalFlow: version.approvalFlow,
        slaHours: version.slaHours,
        changeDescription: `${changeDescription} (reverted from v${versionNumber})`,
        changedBy: req.user._id
    });

    await createActivity(
        'template_updated',
        `${req.user.name} reverted template "${template.title}" to v${versionNumber}`,
        { user: req.user._id, template: template._id }
    );

    res.status(200).json({
        status: 'success',
        message: `Template reverted to version ${versionNumber}`,
        data: {
            template,
            version: newVersionNumber
        }
    });
});

exports.deleteTemplate = catchAsync(async (req, res, next) => {
    const template = await Template.findById(req.params.id);

    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    await Template.findByIdAndDelete(req.params.id);
    await TemplateVersion.deleteMany({ template: req.params.id });

    await createActivity(
        'template_deleted',
        `${req.user.name} deleted template "${template.title}"`,
        { user: req.user._id }
    );

    res.status(204).json({
        status: 'success',
        data: null
    });
});
