import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Filter, Eye, Download } from 'lucide-react';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        status: 'all',
        template: 'all',
        requester: '',
        sortBy: 'newest'
    });

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests');
                setRequests(res.data.data.requests);
            } catch (err) {
                console.error("Failed to fetch requests", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
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

        if (filters.requester.trim()) {
            const search = filters.requester.toLowerCase();
            result = result.filter(r =>
                r.requester?.name?.toLowerCase().includes(search) ||
                r.requester?.email?.toLowerCase().includes(search)
            );
        }

        result.sort((a, b) => {
            if (filters.sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (filters.sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (filters.sortBy === 'status') {
                return a.status.localeCompare(b.status);
            } else if (filters.sortBy === 'requester') {
                return (a.requester?.name || '').localeCompare(b.requester?.name || '');
            }
            return 0;
        });

        return result;
    }, [requests, filters]);

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-brand-primary/10 text-brand-primary',
            approved: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-red-100 text-red-700',
            escalated: 'bg-orange-100 text-orange-700',
            overdue: 'bg-red-50 text-red-600 border border-red-200'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
                {status}
            </span>
        );
    };

    const exportToExcel = () => {
        const headers = ['ID', 'Template', 'Requester', 'Status', 'Submitted', 'SLA Breached'];
        const rows = filteredRequests.map(r => [
            r._id.slice(-6).toUpperCase(),
            r.template?.title || 'Unknown',
            r.requester?.name || 'Unknown',
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
        a.download = `all-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    if (loading) return <div className="p-8">Loading global request log...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Global Request Log</h1>
                    <p className="text-text-secondary mt-1">Audit trail of all organization requests</p>
                </div>
                <div className="flex gap-2">
                    {requests.length > 0 && (
                        <button onClick={exportToExcel} className="btn btn-secondary text-sm">
                            <Download size={16} /> Export CSV
                        </button>
                    )}
                </div>
            </div>

            { }
            {requests.length > 0 && (
                <div className="flex items-center gap-3 mb-4 flex-wrap">
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

                    <input
                        type="text"
                        placeholder="Search by requester..."
                        value={filters.requester}
                        onChange={(e) => setFilters({ ...filters, requester: e.target.value })}
                        className="input text-sm py-2 w-48"
                    />

                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="input text-sm py-2"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="status">Status (A-Z)</option>
                        <option value="requester">Requester (A-Z)</option>
                    </select>

                    <div className="text-sm text-text-muted ml-auto">
                        Showing {filteredRequests.length} of {requests.length} requests
                    </div>
                </div>
            )}

            <div className="card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-bg-subtle text-xs uppercase text-text-muted font-semibold">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Template</th>
                            <th className="px-6 py-3">Requester</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Submitted</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-text-secondary">
                                    {requests.length === 0 ? 'No requests found in the system.' : 'No matching requests.'}
                                </td>
                            </tr>
                        ) : filteredRequests.map(req => (
                            <tr key={req._id} className="hover:bg-bg-subtle/30 group">
                                <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                                    #{req._id.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-6 py-4 font-medium text-text-primary">
                                    {req.template?.title || 'Unknown Template'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-text-primary">{req.requester?.name || 'Unknown User'}</div>

                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(req.status)}
                                    {req.isSlaBreached && (
                                        <span className="ml-2 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-1 rounded">SLA</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">
                                    {format(new Date(req.createdAt), 'MMM d, yyyy h:mm a')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => navigate(`/requests/${req._id}`)}
                                        className="text-text-secondary hover:text-brand-primary p-1"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRequests;
