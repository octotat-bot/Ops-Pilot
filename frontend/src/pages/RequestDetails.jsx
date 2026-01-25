import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft, Copy } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

const RequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionDialog, setActionDialog] = useState({ isOpen: false, type: '', title: '', message: '' });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/requests/${id}`);
                setData(res.data.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load request');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleCloneRequest = () => {
        
        const cloneData = {
            templateId: request.template._id,
            formData: request.formData,
            isClone: true,
            originalRequestId: request._id
        };
        sessionStorage.setItem('cloneRequestData', JSON.stringify(cloneData));
        navigate('/requests/new');
    };

    if (loading) return <div className="p-8">Loading details...</div>;
    if (error) return <div className="p-8 text-danger">Error: {error}</div>;

    const { request, stages } = data;

    const canApprove = (stage) => {
        if (stage.status !== 'pending') return false;
        
        return stage.assignedToUser?._id === user._id || user.role === 'admin';
    };

    const initiationAction = (action) => {
        let config = { isOpen: true, type: 'info', title: 'Confirm Action', message: 'Proceed?', action };

        switch (action) {
            case 'approve':
                config = {
                    isOpen: true, type: 'success', title: 'Approve Request?',
                    message: 'This will move the request to the next stage or finalize it.',
                    action
                };
                break;
            case 'reject':
                config = {
                    isOpen: true, type: 'danger', title: 'Reject Request?',
                    message: 'This will terminate usage of this request immediately.',
                    action
                };
                break;
            case 'escalate':
                config = {
                    isOpen: true, type: 'danger', title: 'Escalate to Admin?',
                    message: 'This will assign the request to a system administrator for review. You will lose ownership.',
                    action
                };
                break;
        }
        setActionDialog(config);
    };

    const handleConfirmAction = async (comment) => {
        try {
            const action = actionDialog.action;
            await api.patch(`/requests/${request._id}/${action}`, {
                comments: comment
            });
            window.location.reload();
        } catch (err) {
            console.error("Action failed", err);
        }
    };

    return (
        <div>
            {}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-text-primary">Request #{request._id.slice(-6)}</h1>
                            <span className={clsx(
                                "badge",
                                request.status === 'approved' && "bg-emerald-100 text-emerald-700",
                                request.status === 'rejected' && "bg-red-100 text-red-700",
                                request.status === 'pending' && "bg-blue-100 text-blue-700",
                                request.status === 'escalated' && "bg-orange-100 text-orange-700",
                                request.status === 'overdue' && "bg-yellow-100 text-yellow-700"
                            )}>
                                {request.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-text-secondary mt-1">
                            Submitted by <strong>{request.requester.name}</strong> on {format(new Date(request.createdAt), 'MMMM d, yyyy')}
                        </p>
                    </div>
                </div>
                {}
                <button
                    onClick={handleCloneRequest}
                    className="btn btn-secondary flex items-center gap-2"
                    title="Clone this request"
                >
                    <Copy size={16} />
                    Clone Request
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">Request Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            {Object.entries(request.formData || {}).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm font-medium text-text-secondary capitalize">{key.replace(/_/g, ' ')}</p>
                                    <p className="text-base text-text-primary mt-1">{value?.toString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Approval Timeline</h3>

                        <div className="relative border-l-2 border-[#eef2f1] ml-4 pl-8 space-y-10 py-2">
                            {stages.map((stage, idx) => {
                                const isPending = stage.status === 'pending';
                                const isApproved = stage.status === 'approved';
                                const isRejected = stage.status === 'rejected';
                                const isEscalated = stage.status === 'escalated';
                                const isSkipped = stage.status === 'skipped'; 

                                let statusColor = 'bg-gray-200 border-gray-300 text-gray-400';
                                if (isApproved) statusColor = 'bg-emerald-500 border-emerald-500 text-white';
                                if (isRejected) statusColor = 'bg-red-500 border-red-500 text-white';
                                if (isEscalated) statusColor = 'bg-orange-500 border-orange-500 text-white';
                                if (isPending) statusColor = 'bg-white border-brand-primary text-brand-primary ring-4 ring-brand-primary/10';

                                return (
                                    <div key={stage._id} className="relative group">
                                        {}
                                        <div className={clsx(
                                            "absolute -left-[45px] top-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all bg-white z-10",
                                            statusColor
                                        )}>
                                            {isApproved ? <CheckCircle size={18} className="text-white" /> :
                                                isRejected ? <XCircle size={18} className="text-white" /> :
                                                    isEscalated ? <AlertTriangle size={18} className="text-white" /> :
                                                        isPending ? <Clock size={18} className="animate-spin-slow" /> :
                                                            <span className="text-xs font-bold text-gray-400">{idx + 1}</span>}
                                        </div>

                                        <div className={clsx(
                                            "rounded-lg p-4 transition-all",
                                            isPending ? "bg-brand-primary/5 border border-brand-primary/20 shadow-sm" : "bg-transparent"
                                        )}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={clsx("text-sm font-bold", isPending ? "text-brand-primary" : "text-[#1c2b2d]")}>
                                                    {stage.stageName}
                                                </h4>
                                                {stage.actionDate && (
                                                    <span className="text-xs text-[#6f8487] font-mono">
                                                        {format(new Date(stage.actionDate), 'MMM d, HH:mm')}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-[#6f8487] mb-2 flex items-center gap-1">
                                                <span className="font-semibold">Assignee:</span>
                                                <span>{stage.assignedToUser?.name || 'Unassigned'}</span>
                                            </p>

                                            {}
                                            {!isPending && (
                                                <div className="mt-2">
                                                    <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                                        isApproved ? "bg-emerald-100 text-emerald-700" :
                                                            isRejected ? "bg-red-100 text-red-700" :
                                                                isEscalated ? "bg-orange-100 text-orange-700" :
                                                                    "bg-gray-100 text-gray-500"
                                                    )}>
                                                        {stage.status}
                                                    </span>
                                                </div>
                                            )}

                                            {}
                                            {stage.comments && (
                                                <div className="mt-3 bg-white/50 p-2.5 rounded-md border border-[#eef2f1] text-xs text-[#4a5d60] relative">
                                                    <div className="absolute -top-1.5 left-3 w-3 h-3 bg-white border-t border-l border-[#eef2f1] transform rotate-45"></div>
                                                    "{stage.comments}"
                                                </div>
                                            )}

                                            {}
                                            {isPending && canApprove(stage) && (
                                                <div className="mt-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => initiationAction('approve')}
                                                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <CheckCircle size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => initiationAction('reject')}
                                                            className="flex-1 px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <XCircle size={14} /> Reject
                                                        </button>
                                                    </div>
                                                    {user.role === 'manager' && (
                                                        <button
                                                            onClick={() => initiationAction('escalate')}
                                                            className="w-full px-3 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-1"
                                                        >
                                                            <AlertTriangle size={14} /> Escalate to Admin
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={actionDialog.isOpen}
                onClose={() => setActionDialog({ ...actionDialog, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={actionDialog.title}
                message={actionDialog.message}
                type={actionDialog.type}
                inputRequired={true}
                inputPlaceholder="Add a reason or comment..."
            />
        </div>
    );
};

export default RequestDetails;
