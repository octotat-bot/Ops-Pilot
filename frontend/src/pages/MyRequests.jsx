import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, ArrowRight, Download, Copy } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';

const StatusBadge = ({ status, isSlaBreached }) => {
    const getStatusStyle = () => {
        if (status === 'pending') return 'bg-brand-primary/10 text-brand-primary';
        if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
        if (status === 'rejected') return 'bg-red-100 text-red-700';
        if (status === 'escalated') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getStatusStyle()}`}>
                {status}
            </span>
            {isSlaBreached && (
                <span className="text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-1 rounded">
                    OVERDUE
                </span>
            )}
        </div>
    );
};

const MyRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const toast = useToast();

    const [filters, setFilters] = useState({
        status: 'all',
        template: 'all',
        sortBy: 'newest'
    });

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests/me');
                setRequests(res.data.data.requests);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load your requests. Please refresh.');
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();

        const interval = setInterval(fetchRequests, 10000);

        return () => clearInterval(interval);
    }, []);

    const templates = useMemo(() => {
        const unique = new Set();
        requests.forEach(r => {
            if (r.template?.title) {
                unique.add(JSON.stringify({ id: r.template._id, title: r.template.title }));
            }
        });
        return Array.from(unique).map(t => JSON.parse(t));
    }, [requests]);

    const filteredRequests = useMemo(() => {
        let result = [...requests];

        if (filters.status !== 'all') {
            result = result.filter(r => r.status === filters.status);
        }

        if (filters.template !== 'all') {
            result = result.filter(r => r.template?._id === filters.template);
        }

        result.sort((a, b) => {
            if (filters.sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (filters.sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (filters.sortBy === 'status') {
                return a.status.localeCompare(b.status);
            }
            return 0;
        });

        return result;
    }, [requests, filters]);

    const exportToExcel = () => {
        
        const headers = ['ID', 'Template', 'Status', 'Submitted', 'SLA Breached'];
        const rows = filteredRequests.map(r => [
            r._id.slice(-6).toUpperCase(),
            r.template?.title || 'Unknown',
            r.status,
            format(new Date(r.createdAt), 'yyyy-MM-dd HH:mm'),
            r.isSlaBreached ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const handleCloneRequest = (req) => {
        const cloneData = {
            templateId: req.template._id,
            formData: req.formData,
            isClone: true,
            originalRequestId: req._id
        };
        sessionStorage.setItem('cloneRequestData', JSON.stringify(cloneData));
        navigate('/requests/new');
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">My Requests</h1>
                    <p className="text-text-secondary mt-1">Track status of your submitted requests</p>
                </div>

                {requests.length > 0 && (
                    <button
                        onClick={exportToExcel}
                        className="btn btn-secondary text-sm"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                )}
            </div>

            {}
            {requests.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="input text-sm py-2"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="escalated">Escalated</option>
                    </select>

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
                        <option value="status">Status (A-Z)</option>
                    </select>

                    <div className="text-sm text-text-muted ml-auto">
                        Showing {filteredRequests.length} of {requests.length} requests
                    </div>
                </div>
            )}

            <div className="card overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-light bg-bg-subtle text-xs font-semibold uppercase text-text-muted tracking-wide">
                                    <th className="py-3 px-4 w-24">ID</th>
                                    <th className="py-3 px-4">Template</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Submitted On</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {[1,2,3,4,5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                        <td className="py-3 px-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td>
                                        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                        <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg-subtle mb-4 text-text-muted">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">
                            {requests.length === 0 ? 'No requests yet' : 'No matching requests'}
                        </h3>
                        <p className="text-text-secondary mt-2 mb-6 max-w-sm mx-auto">
                            {requests.length === 0
                                ? "You haven't submitted any requests. Start by creating a new one from the sidebar."
                                : 'Try adjusting your filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-light bg-bg-subtle text-xs font-semibold uppercase text-text-muted tracking-wide">
                                    <th className="py-3 px-4 w-24">ID</th>
                                    <th className="py-3 px-4">Template</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Submitted On</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {filteredRequests.map((req) => (
                                    <tr key={req._id} className="hover:bg-bg-subtle/50 transition-colors group">
                                        <td className="py-3 px-4 text-sm font-mono text-text-secondary">
                                            #{req._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-medium text-text-primary">
                                            {req.template?.title || 'Unknown Template'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={req.status} isSlaBreached={req.isSlaBreached} />
                                        </td>
                                        <td className="py-3 px-4 text-sm text-text-secondary">
                                            {format(new Date(req.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCloneRequest(req)}
                                                    className="p-1.5 hover:bg-purple-50 rounded text-purple-600 transition-colors"
                                                    title="Clone this request"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/requests/${req._id}`)}
                                                    className="text-brand-primary hover:text-brand-primary-dark font-medium text-sm flex items-center gap-1"
                                                >
                                                    View Details <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyRequests;
