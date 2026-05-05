import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, ShieldAlert, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const Approvals = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({
        isOpen: false,
        requestId: null,
        requestIds: null, 
        action: '',
        title: '',
        message: '',
        type: 'info',
        confirmText: 'Confirm Action',
        cancelText: 'Cancel'
    });
    const navigate = useNavigate();

    const [selectedIds, setSelectedIds] = useState(new Set());

    const [filters, setFilters] = useState({
        template: 'all',
        sortBy: 'newest'
    });

    const fetchApprovals = async () => {
        try {
            const res = await api.get('/requests/approvals');
            setApprovals(res.data.data.approvals);
            setSelectedIds(new Set()); 
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const templates = useMemo(() => {
        const uniqueTemplates = new Set();
        approvals.forEach(a => {
            if (a.request?.template?.title) {
                uniqueTemplates.add(JSON.stringify({
                    id: a.request.template._id,
                    title: a.request.template.title
                }));
            }
        });
        return Array.from(uniqueTemplates).map(t => JSON.parse(t));
    }, [approvals]);

    const filteredApprovals = useMemo(() => {
        let result = [...approvals];

        if (filters.template !== 'all') {
            result = result.filter(a => a.request?.template?._id === filters.template);
        }

        result.sort((a, b) => {
            if (filters.sortBy === 'newest') {
                return new Date(b.request.createdAt) - new Date(a.request.createdAt);
            } else if (filters.sortBy === 'oldest') {
                return new Date(a.request.createdAt) - new Date(b.request.createdAt);
            } else if (filters.sortBy === 'requester') {
                return (a.request.requester?.name || '').localeCompare(b.request.requester?.name || '');
            }
            return 0;
        });

        return result;
    }, [approvals, filters]);

    const toggleSelection = (requestId) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(requestId)) {
            newSelected.delete(requestId);
        } else {
            newSelected.add(requestId);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApprovals.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredApprovals.map(a => a.request._id)));
        }
    };

    const initiateBulkAction = (action) => {
        if (selectedIds.size === 0) return;

        let title = '';
        let message = '';
        let type = 'info';
        let confirmText = 'Confirm';

        if (action === 'approve') {
            title = `Approve ${selectedIds.size} Request${selectedIds.size > 1 ? 's' : ''}?`;
            message = `This will approve ${selectedIds.size} selected request${selectedIds.size > 1 ? 's' : ''} and forward them to the next stage.`;
            type = 'success';
            confirmText = `Approve ${selectedIds.size}`;
        } else if (action === 'reject') {
            title = `Reject ${selectedIds.size} Request${selectedIds.size > 1 ? 's' : ''}?`;
            message = `This will reject ${selectedIds.size} selected request${selectedIds.size > 1 ? 's' : ''} and terminate the workflow${selectedIds.size > 1 ? 's' : ''}.`;
            type = 'danger';
            confirmText = `Reject ${selectedIds.size}`;
        }

        setDialog({
            isOpen: true,
            requestId: null,
            requestIds: Array.from(selectedIds),
            action,
            title,
            message,
            type,
            confirmText,
            cancelText: 'Cancel'
        });
    };

    const initiateAction = (requestId, action) => {
        let title = '';
        let message = '';
        let type = 'info';
        let confirmText = 'Confirm Action';

        if (action === 'approve') {
            title = 'Approve Request?';
            message = 'This will forward the request to the next stage.';
            type = 'success';
            confirmText = 'Approve';
        } else if (action === 'reject') {
            title = 'Reject Request?';
            message = 'This will terminate this workflow immediately.';
            type = 'danger';
            confirmText = 'Reject';
        } else if (action === 'escalate') {
            title = 'Escalate to Admin?';
            message = 'This request will be reassigned to a System Administrator. You will lose access to approve it.';
            type = 'warning';
            confirmText = 'Escalate';
        }

        setDialog({
            isOpen: true,
            requestId,
            requestIds: null,
            action,
            title,
            message,
            type,
            confirmText,
            cancelText: 'Cancel'
        });
    };

    const handleConfirmAction = async (comment) => {
        if (!dialog.requestId && !dialog.requestIds) {
            setDialog({ ...dialog, isOpen: false });
            return;
        }

        try {
            // Bulk action
            if (dialog.requestIds && dialog.requestIds.length > 0) {
                const promises = dialog.requestIds.map(reqId =>
                    api.patch(`/requests/${reqId}/${dialog.action}`, {
                        comments: comment || `Bulk ${dialog.action} via dashboard`
                    })
                );

                await Promise.all(promises);
                setApprovals(prev => prev.filter(p => !dialog.requestIds.includes(p.request._id)));
                setSelectedIds(new Set());
                setDialog({ ...dialog, isOpen: false });

                const actionLabel = dialog.action === 'approve' ? 'approved' : 'rejected';
                toast.success(`${dialog.requestIds.length} request${dialog.requestIds.length > 1 ? 's' : ''} ${actionLabel} successfully.`);
            }
            // Single action
            else {
                await api.patch(`/requests/${dialog.requestId}/${dialog.action}`, {
                    comments: comment || `Quick ${dialog.action} via dashboard`
                });
                setApprovals(prev => prev.filter(p => p.request._id !== dialog.requestId));
                setDialog({ ...dialog, isOpen: false });

                const actionLabel = dialog.action === 'approve' ? 'approved' : dialog.action === 'reject' ? 'rejected' : 'escalated';
                toast.success(`Request ${actionLabel} successfully.`);
            }
        } catch (err) {
            fetchApprovals();
            toast.error(err.response?.data?.message || 'Action failed. Please try again.');
            setDialog({
                ...dialog,
                type: 'danger',
                title: 'Action Failed',
                message: err.response?.data?.message || err.message,
                requestId: null,
                requestIds: null,
                confirmText: 'Close',
                cancelText: null
            });
            console.error('Action error', err);
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Pending Approvals</h1>
                    <p className="text-text-secondary mt-1">Requests waiting for your decision</p>
                </div>

                {}
                <div className="flex items-center gap-3">
                    <select
                        value={filters.template}
                        onChange={(e) => setFilters({ ...filters, template: e.target.value })}
                        className="input text-sm py-2"
                    >
                        <option value="all">All Templates</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>

                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="input text-sm py-2"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="requester">Requester (A-Z)</option>
                    </select>
                </div>
            </div>

            {}
            {selectedIds.size > 0 && (
                <div className="mb-4 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckSquare size={20} className="text-brand-primary" />
                        <span className="font-semibold text-text-primary">
                            {selectedIds.size} request{selectedIds.size > 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="btn btn-secondary text-sm"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={() => initiateBulkAction('approve')}
                            className="btn btn-primary bg-success hover:bg-green-700 text-white text-sm"
                        >
                            <Check size={16} /> Approve {selectedIds.size}
                        </button>
                        <button
                            onClick={() => initiateBulkAction('reject')}
                            className="btn btn-secondary text-danger border-danger/30 hover:bg-danger/5 hover:text-danger text-sm"
                        >
                            <X size={16} /> Reject {selectedIds.size}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-[#eef2f1] rounded-xl"></div>)}
                    </div>
                ) : filteredApprovals.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/10 mb-4 text-success">
                            <Check size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">
                            {approvals.length === 0 ? 'All caught up!' : 'No matching approvals'}
                        </h3>
                        <p className="text-text-secondary mt-2">
                            {approvals.length === 0
                                ? 'You have no pending approvals at the moment.'
                                : 'Try adjusting your filters.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {}
                        {filteredApprovals.length > 1 && (
                            <div className="flex items-center gap-2 p-3 bg-bg-subtle rounded-lg">
                                <button
                                    onClick={toggleSelectAll}
                                    className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-brand-primary transition-colors"
                                >
                                    {selectedIds.size === filteredApprovals.length ? (
                                        <CheckSquare size={18} className="text-brand-primary" />
                                    ) : (
                                        <Square size={18} />
                                    )}
                                    Select All ({filteredApprovals.length})
                                </button>
                            </div>
                        )}

                        {filteredApprovals.map(approval => (
                            <div key={approval._id} className="card p-5 flex items-start gap-4">
                                {}
                                <button
                                    onClick={() => toggleSelection(approval.request._id)}
                                    className="mt-1 flex-shrink-0"
                                >
                                    {selectedIds.has(approval.request._id) ? (
                                        <CheckSquare size={20} className="text-brand-primary" />
                                    ) : (
                                        <Square size={20} className="text-text-muted hover:text-brand-primary transition-colors" />
                                    )}
                                </button>

                                {}
                                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-text-primary text-lg">
                                                {approval.request?.template?.title}
                                            </h3>
                                            <span className="text-xs bg-bg-subtle text-text-secondary px-2 py-0.5 rounded border border-border-light">
                                                Stage: {approval.stageName}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary mb-2">
                                            from <span className="font-medium text-text-primary">{approval.request?.requester?.name}</span> • Submitted {format(new Date(approval.request.createdAt), 'MMM d, h:mm a')}
                                        </p>
                                        <p className="text-xs text-text-muted font-mono">ID: {approval.request._id}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(`/requests/${approval.request._id}`)}
                                            className="btn btn-secondary text-sm"
                                        >
                                            Review Details
                                        </button>

                                        {user?.role === 'manager' && (
                                            <button
                                                onClick={() => initiateAction(approval.request._id, 'escalate')}
                                                className="btn btn-secondary text-warning border-warning/30 hover:bg-warning/5 hover:text-warning text-sm"
                                                title="Escalate to Admin"
                                            >
                                                <ShieldAlert size={16} /> Escalate
                                            </button>
                                        )}

                                        <button
                                            onClick={() => initiateAction(approval.request._id, 'approve')}
                                            className="btn btn-primary bg-success hover:bg-green-700 text-white text-sm"
                                        >
                                            <Check size={16} /> Approve
                                        </button>
                                        <button
                                            onClick={() => initiateAction(approval.request._id, 'reject')}
                                            className="btn btn-secondary text-danger border-danger/30 hover:bg-danger/5 hover:text-danger text-sm"
                                        >
                                            <X size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <ConfirmDialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                inputRequired={dialog.type !== 'danger' && dialog.title !== 'Action Failed'}
                inputPlaceholder="Optional comment..."
                confirmText={dialog.confirmText}
                cancelText={dialog.cancelText}
            />
        </div>
    );
};

export default Approvals;
