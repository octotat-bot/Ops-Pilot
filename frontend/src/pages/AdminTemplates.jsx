import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';
import {
    Plus, Edit, Trash2, History, Eye, EyeOff, Users,
    Briefcase, User, FileText, Clock, Tag, AlertCircle,
    CheckCircle2, X, Search, Filter
} from 'lucide-react';
import TemplateVersionHistory from '../components/TemplateVersionHistory';

const AdminTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [publishDialogOpen, setPublishDialogOpen] = useState(false);
    const [newlyCreatedTemplate, setNewlyCreatedTemplate] = useState(null);
    const [versionHistoryTemplate, setVersionHistoryTemplate] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [newTemplateData, setNewTemplateData] = useState({
        title: '',
        description: '',
        slaHours: 24,
        category: '',
        priority: 'medium',
        accessLevel: 'all',
        fields: [{ name: 'reason', label: 'Reason for Request', type: 'textarea', required: true }],
        stages: [{ stageOrder: 1, roleRequired: 'Manager' }]
    });

    useEffect(() => {
        fetchTemplates();
        if (searchParams.get('create') === 'true') {
            setCreateModalOpen(true);
            setSearchParams({});
        }
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates');
            setTemplates(res.data.data.templates);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };





    const togglePublish = async (template) => {
        try {
            await api.patch(`/templates/${template._id}`, {
                isPublished: !template.isPublished,
                changeDescription: template.isPublished ? 'Unpublished template' : 'Published template'
            });
            fetchTemplates();
        } catch (err) {
            console.error('Failed to update template:', err);
        }
    };

    const publishNewTemplate = async () => {
        if (!newlyCreatedTemplate) return;

        try {
            await api.patch(`/templates/${newlyCreatedTemplate._id}`, {
                isPublished: true,
                changeDescription: 'Initial publication'
            });
            setPublishDialogOpen(false);
            setNewlyCreatedTemplate(null);
            fetchTemplates();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to publish template');
        }
    };

    const handleDeleteClick = (templateId) => {
        setTemplateToDelete(templateId);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteTemplate = async () => {
        if (!templateToDelete) return;

        try {
            await api.delete(`/templates/${templateToDelete}`);
            fetchTemplates();
            setDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete template');
        }
    };

    const handleEditTemplate = (template) => {
        setNewTemplateData({
            _id: template._id,
            title: template.title,
            description: template.description,
            slaHours: template.slaHours,
            category: template.category,
            priority: template.priority,
            accessLevel: template.accessLevel,
            fields: template.formSchema?.fields || [{ name: 'reason', label: 'Reason for Request', type: 'textarea', required: true }],
            stages: template.approvalFlow.map(s => ({
                stageOrder: s.stageOrder,
                roleRequired: s.roleRequired
            }))
        });
        setCreateModalOpen(true);
    };

    const handleSaveTemplate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newTemplateData.title,
                description: newTemplateData.description,
                slaHours: newTemplateData.slaHours,
                category: newTemplateData.category || 'Other',
                priority: newTemplateData.priority,
                accessLevel: newTemplateData.accessLevel,
                formSchema: {
                    fields: newTemplateData.fields
                },
                approvalFlow: newTemplateData.stages.map(s => ({
                    stageOrder: s.stageOrder,
                    roleRequired: s.roleRequired
                }))
            };

            if (newTemplateData._id) {
                // Update
                await api.patch(`/templates/${newTemplateData._id}`, {
                    ...payload,
                    changeDescription: 'Updated by admin'
                });
            } else {
                // Create
                const response = await api.post('/templates', payload);
                const createdTemplate = response.data.data.template;
                setNewlyCreatedTemplate(createdTemplate);
                setPublishDialogOpen(true);
            }

            setCreateModalOpen(false);
            setNewTemplateData({
                title: '',
                description: '',
                slaHours: 24,
                category: '',
                priority: 'medium',
                accessLevel: 'all',
                fields: [{ name: 'reason', label: 'Reason for Request', type: 'textarea', required: true }],
                stages: [{ stageOrder: 1, roleRequired: 'Manager' }]
            });
            fetchTemplates();
        } catch (err) {
            console.error("Failed to save template", err);
            alert(err.response?.data?.message || 'Failed to save template');
        }
    };

    const skipPublish = () => {
        setPublishDialogOpen(false);
        setNewlyCreatedTemplate(null);
    };

    const getAccessLevelBadge = (accessLevel) => {
        const configs = {
            all: { icon: Users, label: 'All Users', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            manager: { icon: Briefcase, label: 'Managers Only', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            employee: { icon: User, label: 'Employees Only', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
        };
        return configs[accessLevel] || configs.all;
    };

    const getCategoryColor = (category) => {
        const colors = {
            HR: 'bg-pink-100 text-pink-700',
            IT: 'bg-cyan-100 text-cyan-700',
            Finance: 'bg-yellow-100 text-yellow-700',
            Operations: 'bg-indigo-100 text-indigo-700',
            Facilities: 'bg-green-100 text-green-700',
            Other: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || colors.Other;
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'published' && t.isPublished) ||
            (filterStatus === 'draft' && !t.isPublished);
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6">
            { }
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Template Management</h1>
                    <p className="text-text-secondary mt-1">Create and manage request templates with custom workflows</p>
                </div>
                <button
                    onClick={() => {
                        setNewTemplateData({
                            title: '',
                            description: '',
                            slaHours: 24,
                            category: '',
                            priority: 'medium',
                            accessLevel: 'all',
                            fields: [{ name: 'reason', label: 'Reason for Request', type: 'textarea', required: true }],
                            stages: [{ stageOrder: 1, roleRequired: 'Manager' }]
                        });
                        setCreateModalOpen(true);
                    }}
                    className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <Plus size={18} />
                    Create Template
                </button>
            </div>

            {/* FILTERS */}
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Categories</option>
                            <option value="HR">HR & Personnel</option>
                            <option value="IT">IT & Technology</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TEMPLATES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => {
                    const accessConfig = getAccessLevelBadge(template.accessLevel || 'all');
                    const AccessIcon = accessConfig.icon;

                    return (
                        <div key={template._id} className="card p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            {/* Card Header */}
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                                            {template.title}
                                        </h3>
                                        {template.currentVersion > 1 && (
                                            <span className="text-xs text-text-muted">v{template.currentVersion}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEditTemplate(template)}
                                            className="p-2 rounded-lg transition-all hover:bg-blue-50 text-blue-600"
                                            title="Edit Template"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(template._id)}
                                            className="p-2 rounded-lg transition-all hover:bg-red-50 text-red-600"
                                            title="Delete Template"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        {template.isPublished ? (
                                            <button
                                                onClick={() => togglePublish(template)}
                                                className="p-2 rounded-lg transition-all bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                                                title="Published - Click to unpublish"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => togglePublish(template)}
                                                className="p-2 rounded-lg transition-all bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                                                title="Click to publish"
                                            >
                                                <EyeOff size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                                    {template.description}
                                </p>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {template.category && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(template.category)}`}>
                                            {template.category}
                                        </span>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${accessConfig.color} flex items-center gap-1`}>
                                        <AccessIcon size={12} />
                                        {accessConfig.label}
                                    </span>
                                </div>
                            </div>

                            {/* Stats Footer */}
                            <div className="px-6 py-4 bg-bg-subtle border-t border-border-light">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-text-muted mb-1">SLA</div>
                                        <div className="text-sm font-semibold text-text-primary flex items-center justify-center gap-1">
                                            <Clock size={14} />
                                            {template.slaHours}h
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted mb-1">Fields</div>
                                        <div className="text-sm font-semibold text-text-primary flex items-center justify-center gap-1">
                                            <FileText size={14} />
                                            {template.formSchema?.fields?.length || 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted mb-1">Stages</div>
                                        <div className="text-sm font-semibold text-text-primary flex items-center justify-center gap-1">
                                            <CheckCircle2 size={14} />
                                            {template.approvalFlow?.length || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="card p-12 text-center">
                    <FileText size={48} className="mx-auto text-text-muted mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No templates found</h3>
                    <p className="text-text-secondary mb-4">
                        {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Create your first template to get started'}
                    </p>
                </div>
            )}

            {/* VERSION HISTORY MODAL */}
            {versionHistoryTemplate && (
                <TemplateVersionHistory
                    template={versionHistoryTemplate}
                    onClose={() => setVersionHistoryTemplate(null)}
                    onRevert={() => {
                        fetchTemplates();
                        setVersionHistoryTemplate(null);
                    }}
                />
            )}

            {/* CREATE/EDIT MODAL */}
            {createModalOpen && (
                <CreateTemplateModal
                    newTemplateData={newTemplateData}
                    setNewTemplateData={setNewTemplateData}
                    onSubmit={handleSaveTemplate}
                    onClose={() => setCreateModalOpen(false)}
                />
            )}

            { }
            {publishDialogOpen && newlyCreatedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={skipPublish}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                                <CheckCircle2 size={32} className="text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">
                                Template Created Successfully!
                            </h2>
                            <p className="text-text-secondary">
                                "{newlyCreatedTemplate.title}" has been created as a draft.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-semibold text-amber-900 mb-1">Template is currently a draft</p>
                                    <p className="text-amber-700">
                                        Employees and managers won't be able to see this template until you publish it.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={publishNewTemplate}
                                className="w-full btn btn-primary flex items-center justify-center gap-2"
                            >
                                <Eye size={18} />
                                Publish Now
                            </button>
                            <button
                                onClick={skipPublish}
                                className="w-full btn btn-ghost"
                            >
                                Publish Later
                            </button>
                        </div>

                        <p className="text-xs text-text-muted text-center mt-4">
                            You can publish it later from the Templates page
                        </p>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION DIALOG */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDeleteTemplate}
                title="Delete Template"
                message="Are you sure you want to delete this template? This action cannot be undone and will permanently remove the template."
                confirmText="Delete Template"
                type="danger"
            />
        </div>
    );
};

const CreateTemplateModal = ({ newTemplateData, setNewTemplateData, onSubmit, onClose }) => {
    const isEditing = !!newTemplateData._id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-border-light bg-gradient-to-r from-brand-primary/5 to-brand-primary/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">
                                {isEditing ? 'Edit Template' : 'Create New Template'}
                            </h2>
                            <p className="text-sm text-text-secondary mt-1">
                                {isEditing ? 'Update existing template details' : 'Define a new workflow template'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={onSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Template Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="e.g., Equipment Request, Leave Application"
                                    value={newTemplateData.title}
                                    onChange={e => setNewTemplateData({ ...newTemplateData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input"
                                    placeholder="Describe the purpose of this template..."
                                    value={newTemplateData.description}
                                    onChange={e => setNewTemplateData({ ...newTemplateData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Access Level <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="input"
                                        value={newTemplateData.accessLevel}
                                        onChange={e => setNewTemplateData({ ...newTemplateData, accessLevel: e.target.value })}
                                    >
                                        <option value="all">All Users</option>
                                        <option value="manager">Managers Only</option>
                                        <option value="employee">Employees Only</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        Priority Level
                                    </label>
                                    <select
                                        className="input"
                                        value={newTemplateData.priority || 'medium'}
                                        onChange={e => setNewTemplateData({ ...newTemplateData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-2">
                                        SLA (Hours) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="input"
                                        value={newTemplateData.slaHours}
                                        onChange={e => setNewTemplateData({ ...newTemplateData, slaHours: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Simplified Approval Flow */}
                        <div className="space-y-4 pt-6 border-t border-border-light">
                            <h3 className="text-lg font-semibold text-text-primary">Approval Flow</h3>

                            <div className="space-y-3">
                                {newTemplateData.stages.map((stage, index) => (
                                    <div key={index} className="p-4 border-2 border-border-light rounded-xl bg-bg-subtle/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                                                {stage.stageOrder}
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-medium text-text-muted mb-1">Approver Role</label>
                                                <select
                                                    className="input"
                                                    value={stage.roleRequired}
                                                    onChange={e => {
                                                        const updated = [...newTemplateData.stages];
                                                        updated[index].roleRequired = e.target.value;
                                                        setNewTemplateData({ ...newTemplateData, stages: updated });
                                                    }}
                                                >
                                                    <option value="Manager">Manager</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-text-muted flex items-start gap-2">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                Requests will be routed through these approval stages.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-border-light bg-bg-subtle/30 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {isEditing ? (
                                <>
                                    <CheckCircle2 size={18} />
                                    Save Changes
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Create Template
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminTemplates;
