import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Users, X, Plus, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmDialog from '../components/ConfirmDialog';

const Delegations = () => {
    const { user } = useAuth();
    const [myDelegations, setMyDelegations] = useState([]);
    const [delegationsToMe, setDelegationsToMe] = useState([]);
    const [users, setUsers] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, delegationId: null });
    const [formData, setFormData] = useState({
        delegate: '',
        startDate: '',
        endDate: '',
        reason: '',
        scope: 'all',
        templates: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [myDelegationsRes, delegationsToMeRes, usersRes, templatesRes] = await Promise.all([
                api.get('/delegations/my-delegations'),
                api.get('/delegations/to-me'),
                api.get('/users'),
                api.get('/templates')
            ]);

            setMyDelegations(myDelegationsRes.data.data.delegations);
            setDelegationsToMe(delegationsToMeRes.data.data.delegations);
            setUsers(usersRes.data.data.users.filter(u => u._id !== user._id)); 
            setTemplates(templatesRes.data.data.templates);
        } catch (err) {
            console.error('Failed to fetch delegations', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDelegation = async (e) => {
        e.preventDefault();
        try {
            await api.post('/delegations', formData);
            setCreateModalOpen(false);
            setFormData({
                delegate: '',
                startDate: '',
                endDate: '',
                reason: '',
                scope: 'all',
                templates: []
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create delegation');
        }
    };

    const handleDeactivate = async () => {
        try {
            await api.patch(`/delegations/${confirmDialog.delegationId}/deactivate`);
            setConfirmDialog({ isOpen: false, delegationId: null });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to deactivate delegation');
        }
    };

    const isCurrentlyActive = (delegation) => {
        const now = new Date();
        const start = new Date(delegation.startDate);
        const end = new Date(delegation.endDate);
        return delegation.isActive && start <= now && end >= now;
    };

    if (loading) return <div className="p-8">Loading...</div>;

    if (user?.role !== 'manager') {
        return (
            <div className="p-8">
                <div className="card p-12 text-center">
                    <UserX size={48} className="mx-auto text-text-muted mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">Delegations - Managers Only</h3>
                    <p className="text-text-secondary mb-4">
                        {user?.role === 'admin'
                            ? 'Admins handle all requests directly and do not need delegations.'
                            : 'Only managers can create and manage delegations.'}
                    </p>
                    <p className="text-sm text-text-muted">
                        {user?.role === 'admin'
                            ? 'As an admin, you automatically have access to all approval requests without needing delegation.'
                            : 'If you need delegation capabilities, please contact your administrator.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Delegations</h1>
                    <p className="text-text-secondary mt-1">Delegate your approval responsibilities to other managers during vacation or high workload periods</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> Create Delegation
                </button>
            </div>

            {}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">My Delegations</h2>
                {myDelegations.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No delegations created yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myDelegations.map(delegation => (
                            <div key={delegation._id} className="p-4 border border-border-light rounded-lg flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCheck size={16} className="text-brand-primary" />
                                        <span className="font-semibold text-text-primary">
                                            Delegated to: {delegation.delegate?.name}
                                        </span>
                                        {isCurrentlyActive(delegation) ? (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                                Active Now
                                            </span>
                                        ) : delegation.isActive ? (
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                                Scheduled
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-text-secondary space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} />
                                            <span>
                                                {format(new Date(delegation.startDate), 'MMM d, yyyy')} - {format(new Date(delegation.endDate), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        <p><strong>Reason:</strong> {delegation.reason}</p>
                                        <p><strong>Scope:</strong> {delegation.scope === 'all' ? 'All templates' : `${delegation.templates?.length || 0} specific templates`}</p>
                                    </div>
                                </div>
                                {delegation.isActive && (
                                    <button
                                        onClick={() => setConfirmDialog({ isOpen: true, delegationId: delegation._id })}
                                        className="btn btn-secondary text-danger border-danger/30 hover:bg-danger/5 text-sm"
                                    >
                                        Deactivate
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Delegations To Me</h2>
                {delegationsToMe.length === 0 ? (
                    <div className="text-center py-8 text-text-muted">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No one has delegated to you yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {delegationsToMe.map(delegation => (
                            <div key={delegation._id} className="p-4 border border-border-light rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck size={16} className="text-purple-600" />
                                    <span className="font-semibold text-text-primary">
                                        From: {delegation.delegator?.name}
                                    </span>
                                    {isCurrentlyActive(delegation) && (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                            Active Now
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-text-secondary space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>
                                            {format(new Date(delegation.startDate), 'MMM d, yyyy')} - {format(new Date(delegation.endDate), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <p><strong>Reason:</strong> {delegation.reason}</p>
                                    <p><strong>Scope:</strong> {delegation.scope === 'all' ? 'All templates' : `${delegation.templates?.length || 0} specific templates`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {}
            {createModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {}
                        <div className="sticky top-0 bg-white border-b border-border-light px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Create Delegation</h3>
                                <p className="text-sm text-text-secondary mt-0.5">Temporarily delegate your approval responsibilities to another manager</p>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-text-muted hover:text-text-primary transition-colors p-1 hover:bg-bg-subtle rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDelegation} className="p-6">
                            {}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                                        <Users size={16} className="text-brand-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary">Delegate Information</h4>
                                        <p className="text-xs text-text-muted">Choose who will handle approvals on your behalf</p>
                                    </div>
                                </div>

                                <div className="bg-bg-subtle rounded-lg p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Delegate To <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            required
                                            value={formData.delegate}
                                            onChange={(e) => setFormData({ ...formData, delegate: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Select a manager...</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u._id}>
                                                    {u.name} - {u.email}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-text-muted mt-1.5">
                                            💡 Only other managers can be selected as delegates
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Calendar size={16} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary">Delegation Period</h4>
                                        <p className="text-xs text-text-muted">Set the start and end dates for this delegation</p>
                                    </div>
                                </div>

                                <div className="bg-bg-subtle rounded-lg p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                Start Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="input w-full"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-text-primary mb-2">
                                                End Date <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="input w-full"
                                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-text-muted mt-3">
                                        📅 Delegation will be active from start date to end date (inclusive)
                                    </p>
                                </div>
                            </div>

                            {}
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <UserCheck size={16} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary">Details & Scope</h4>
                                        <p className="text-xs text-text-muted">Provide context and define the delegation scope</p>
                                    </div>
                                </div>

                                <div className="bg-bg-subtle rounded-lg p-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Reason for Delegation <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            required
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            className="input w-full"
                                            rows="3"
                                            placeholder="e.g., Annual vacation, Medical leave, High workload period..."
                                        />
                                        <p className="text-xs text-text-muted mt-1.5">
                                            Provide a brief explanation for this delegation
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Delegation Scope
                                        </label>
                                        <select
                                            value={formData.scope}
                                            onChange={(e) => setFormData({ ...formData, scope: e.target.value, templates: [] })}
                                            className="input w-full"
                                        >
                                            <option value="all">All Templates (Full Delegation)</option>
                                            <option value="specific_templates">Specific Templates Only</option>
                                        </select>
                                        <p className="text-xs text-text-muted mt-1.5">
                                            {formData.scope === 'all'
                                                ? '✅ Delegate will handle ALL approval requests on your behalf'
                                                : '🎯 Delegate will only handle selected template types'}
                                        </p>
                                    </div>

                                    {formData.scope === 'specific_templates' && (
                                        <div className="pt-2 border-t border-border-light">
                                            <label className="block text-sm font-medium text-text-primary mb-3">
                                                Select Templates <span className="text-danger">*</span>
                                            </label>
                                            <div className="border border-border-light rounded-lg p-3 max-h-48 overflow-y-auto bg-white space-y-2">
                                                {templates.length === 0 ? (
                                                    <p className="text-sm text-text-muted text-center py-4">No templates available</p>
                                                ) : (
                                                    templates.map(template => (
                                                        <label
                                                            key={template._id}
                                                            className="flex items-center gap-3 p-2 hover:bg-bg-subtle rounded cursor-pointer transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.templates.includes(template._id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, templates: [...formData.templates, template._id] });
                                                                    } else {
                                                                        setFormData({ ...formData, templates: formData.templates.filter(t => t !== template._id) });
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                                            />
                                                            <span className="text-sm text-text-primary font-medium">{template.title}</span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                            {formData.templates.length > 0 && (
                                                <p className="text-xs text-emerald-600 mt-2">
                                                    ✓ {formData.templates.length} template{formData.templates.length !== 1 ? 's' : ''} selected
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {}
                            <div className="flex justify-end gap-3 pt-4 border-t border-border-light">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Create Delegation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, delegationId: null })}
                onConfirm={handleDeactivate}
                title="Deactivate Delegation"
                message="Are you sure you want to deactivate this delegation? This action will stop the delegation immediately and cannot be undone."
                type="danger"
            />
        </div>
    );
};

export default Delegations;
