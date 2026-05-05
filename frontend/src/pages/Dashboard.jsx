import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import {
    Clock, AlertTriangle, CheckCircle2, ArrowRight,
    Activity, FileText, AlertOctagon, PlusCircle,
    Users, LayoutDashboard, ShieldCheck, BarChart2,
    Inbox, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import ActivityFeed from '../components/ActivityFeed';

/* ── shared tiny components ── */
const StatusBadge = ({ status }) => {
    const map = {
        pending:  'bg-blue-100 text-blue-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        escalated:'bg-orange-100 text-orange-700',
        overdue:  'bg-yellow-100 text-yellow-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${map[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
};

const MetricCard = ({ label, value, sub, icon: Icon, color, onClick, highlight }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden p-6 rounded-xl border transition-all duration-200 bg-white
            ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
            ${highlight ? 'border-brand-primary/30 ring-2 ring-brand-primary/10 shadow-md' : 'border-[#eef2f1] hover:border-brand-primary/20'}`}
    >
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${color}`}><Icon size={20} /></div>
            {onClick && <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-primary mt-1" />}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">{label}</p>
        <p className="text-3xl font-bold text-text-primary">{value}</p>
        {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
);

const Skeleton = () => (
    <div className="bg-white border border-[#eef2f1] rounded-xl p-6 animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4" />
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
);

const RequestRow = ({ req, onView, showRequester }) => (
    <tr className="hover:bg-[#f8faf9] transition-colors group">
        <td className="px-6 py-3 font-mono text-xs text-gray-500 font-semibold">#{req._id.slice(-6).toUpperCase()}</td>
        <td className="px-6 py-3 text-sm font-medium text-gray-800">{req.template?.title || req.templateSnapshot?.title || '—'}</td>
        {showRequester && <td className="px-6 py-3 text-sm text-gray-600">{req.requester?.name || '—'}</td>}
        <td className="px-6 py-3"><StatusBadge status={req.status} /></td>
        <td className="px-6 py-3 text-xs text-gray-400">{format(new Date(req.createdAt), 'MMM d, yyyy')}</td>
        <td className="px-6 py-3 text-right">
            <button onClick={() => onView(req._id)}
                className="opacity-0 group-hover:opacity-100 text-brand-primary text-xs font-semibold bg-brand-primary/5 px-3 py-1 rounded hover:bg-brand-primary/10 transition-all flex items-center gap-1 ml-auto">
                View <ArrowRight size={11} />
            </button>
        </td>
    </tr>
);

/* ══════════════════ EMPLOYEE DASHBOARD ══════════════════ */
const EmployeeDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/requests/me').then(r => {
            setRequests(r.data.data.requests || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const active    = requests.filter(r => !['approved','rejected'].includes(r.status)).length;
    const approved  = requests.filter(r => r.status === 'approved').length;
    const overdue   = requests.filter(r => r.isSlaBreached).length;
    const total     = requests.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back, <strong>{user?.name}</strong> — here's your overview.</p>
                </div>
                <button onClick={() => navigate('/requests/new')}
                    className="btn btn-primary flex items-center gap-2">
                    <PlusCircle size={16} /> New Request
                </button>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div onClick={() => navigate('/requests/new')}
                    className="cursor-pointer bg-gradient-to-br from-brand-primary to-brand-primary/80 rounded-xl p-5 text-white hover:shadow-lg hover:scale-[1.01] transition-all">
                    <PlusCircle size={24} className="mb-3 opacity-90" />
                    <p className="font-bold text-base">Submit a Request</p>
                    <p className="text-xs opacity-70 mt-1">Leave, Equipment, WFH & more</p>
                </div>
                <div onClick={() => navigate('/my-requests')}
                    className="cursor-pointer bg-white rounded-xl border border-[#eef2f1] p-5 hover:shadow-md hover:border-brand-primary/20 transition-all">
                    <FileText size={24} className="mb-3 text-brand-primary" />
                    <p className="font-bold text-base text-gray-900">My Requests</p>
                    <p className="text-xs text-gray-400 mt-1">{total} total submitted</p>
                </div>
                <div onClick={() => navigate('/profile')}
                    className="cursor-pointer bg-white rounded-xl border border-[#eef2f1] p-5 hover:shadow-md hover:border-brand-primary/20 transition-all">
                    <LayoutDashboard size={24} className="mb-3 text-indigo-500" />
                    <p className="font-bold text-base text-gray-900">My Profile</p>
                    <p className="text-xs text-gray-400 mt-1">Settings & preferences</p>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <Skeleton /><Skeleton /><Skeleton /><Skeleton />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <MetricCard label="Active" value={active} sub="In progress" icon={Activity} color="text-brand-primary bg-brand-primary/10" />
                    <MetricCard label="Approved" value={approved} sub="Completed" icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
                    <MetricCard label="Overdue" value={overdue} sub="SLA breached" icon={AlertOctagon} color="text-red-500 bg-red-50" />
                    <MetricCard label="Total" value={total} sub="All time" icon={FileText} color="text-indigo-500 bg-indigo-50" />
                </div>
            )}

            {/* Recent requests */}
            <div className="bg-white rounded-xl border border-[#eef2f1] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#eef2f1] flex justify-between items-center">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">Recent Requests</h3>
                    <button onClick={() => navigate('/my-requests')} className="text-xs font-semibold text-brand-primary flex items-center gap-1">View all <ArrowRight size={12} /></button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">ID</th><th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Status</th><th className="px-6 py-3">Date</th><th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2f1]">
                        {requests.slice(0,5).map(r => <RequestRow key={r._id} req={r} onView={id => navigate(`/requests/${id}`)} />)}
                        {requests.length === 0 && (
                            <tr><td colSpan={5} className="py-10 text-center text-gray-400 italic">No requests yet. Submit your first one!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ActivityFeed limit={8} />
        </div>
    );
};

/* ══════════════════ MANAGER DASHBOARD ══════════════════ */
const ManagerDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState([]);
    const [myReqs, setMyReqs]       = useState([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/requests/approvals'),
            api.get('/requests/me'),
        ]).then(([appRes, myRes]) => {
            setApprovals(appRes.data.data.approvals || []);
            setMyReqs(myRes.data.data.requests || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const pending   = approvals.length;
    const myActive  = myReqs.filter(r => !['approved','rejected'].includes(r.status)).length;
    const myDone    = myReqs.filter(r => r.status === 'approved').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Hello, <strong>{user?.name}</strong> — manage your team's requests.</p>
                </div>
                <button onClick={() => navigate('/requests/new')} className="btn btn-primary flex items-center gap-2">
                    <PlusCircle size={16} /> New Request
                </button>
            </div>

            {/* Pending approvals banner */}
            {!loading && pending > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Clock size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="font-bold text-orange-800">You have <span className="text-orange-600">{pending}</span> pending approval{pending !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-orange-600 mt-0.5">Review and take action to avoid SLA breaches.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/approvals')}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                        Review Queue <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5"><Skeleton /><Skeleton /><Skeleton /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <MetricCard label="Pending Approvals" value={pending} sub="Need your action"
                        icon={Clock} color="text-orange-500 bg-orange-50" highlight={pending > 0}
                        onClick={() => navigate('/approvals')} />
                    <MetricCard label="My Active Requests" value={myActive} sub="In progress"
                        icon={Activity} color="text-brand-primary bg-brand-primary/10"
                        onClick={() => navigate('/my-requests')} />
                    <MetricCard label="My Approved" value={myDone} sub="Completed"
                        icon={CheckCircle2} color="text-emerald-600 bg-emerald-50" />
                </div>
            )}

            {/* Approval queue preview */}
            <div className="bg-white rounded-xl border border-[#eef2f1] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#eef2f1] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">Approval Queue</h3>
                        {pending > 0 && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">{pending}</span>}
                    </div>
                    <button onClick={() => navigate('/approvals')} className="text-xs font-semibold text-brand-primary flex items-center gap-1">View all <ArrowRight size={12} /></button>
                </div>
                {loading ? (
                    <div className="p-6 space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}</div>
                ) : approvals.length === 0 ? (
                    <div className="py-12 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                        <p className="font-semibold text-gray-700">All clear!</p>
                        <p className="text-xs text-gray-400 mt-1">No pending approvals right now.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">ID</th><th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Requester</th><th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Submitted</th><th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef2f1]">
                            {approvals.slice(0,6).map(stage => {
                                const req = stage.request;
                                if (!req) return null;
                                return (
                                    <tr key={stage._id} className="hover:bg-orange-50/40 group transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">#{req._id?.slice(-6).toUpperCase()}</td>
                                        <td className="px-6 py-3 font-medium text-gray-800">{req.template?.title || '—'}</td>
                                        <td className="px-6 py-3 text-gray-600">{req.requester?.name || '—'}</td>
                                        <td className="px-6 py-3"><StatusBadge status={req.status} /></td>
                                        <td className="px-6 py-3 text-xs text-gray-400">{req.createdAt ? format(new Date(req.createdAt), 'MMM d') : '—'}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => navigate(`/requests/${req._id}`)}
                                                className="opacity-0 group-hover:opacity-100 text-orange-600 text-xs font-bold bg-orange-50 px-3 py-1 rounded hover:bg-orange-100 transition-all flex items-center gap-1 ml-auto">
                                                Approve <ArrowRight size={11} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <ActivityFeed limit={8} />
        </div>
    );
};

/* ══════════════════ ADMIN DASHBOARD ══════════════════ */
const AdminDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats]     = useState(null);
    const [requests, setReqs]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/analytics?days=30'),
            api.get('/requests?limit=6'),
        ]).then(([anaRes, reqRes]) => {
            setStats(anaRes.data.data.analytics);
            setReqs(reqRes.data.data.requests || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const totalReqs   = stats?.totalRequests   ?? 0;
    const totalUsers  = stats?.totalUsers      ?? 0;
    const approvedPct = stats?.approvalRate    ?? 0;
    const slaBreached = stats?.slaBreachCount  ?? 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck size={20} className="text-brand-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Admin</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome, <strong>{user?.name}</strong> — full platform control.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/users')} className="btn btn-secondary flex items-center gap-2"><Users size={15} /> Manage Users</button>
                    <button onClick={() => navigate('/templates')} className="btn btn-primary flex items-center gap-2"><FileText size={15} /> Templates</button>
                </div>
            </div>

            {/* Admin quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'User Management', sub: 'Roles & accounts', icon: Users, color: 'text-indigo-600 bg-indigo-50', path: '/users' },
                    { label: 'All Requests', sub: 'System-wide view', icon: Inbox, color: 'text-brand-primary bg-brand-primary/10', path: '/global-requests' },
                    { label: 'Templates', sub: 'Forms & workflows', icon: FileText, color: 'text-emerald-600 bg-emerald-50', path: '/templates' },
                    { label: 'Analytics', sub: 'Reports & metrics', icon: BarChart2, color: 'text-purple-600 bg-purple-50', path: '/analytics' },
                ].map(({ label, sub, icon: Icon, color, path }) => (
                    <div key={path} onClick={() => navigate(path)}
                        className="cursor-pointer bg-white rounded-xl border border-[#eef2f1] p-5 hover:shadow-md hover:border-brand-primary/20 transition-all group">
                        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <Icon size={18} />
                        </div>
                        <p className="font-bold text-sm text-gray-900">{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* System stats */}
            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <MetricCard label="Total Requests" value={totalReqs} sub="Last 30 days" icon={Activity} color="text-brand-primary bg-brand-primary/10" />
                    <MetricCard label="Total Users" value={totalUsers} sub="Active accounts" icon={Users} color="text-indigo-500 bg-indigo-50" onClick={() => navigate('/users')} />
                    <MetricCard label="Approval Rate" value={`${approvedPct}%`} sub="Of resolved requests" icon={TrendingUp} color="text-emerald-600 bg-emerald-50" />
                    <MetricCard label="SLA Breaches" value={slaBreached} sub="Overdue requests" icon={AlertOctagon} color="text-red-500 bg-red-50" highlight={slaBreached > 0} />
                </div>
            )}

            {/* All recent requests */}
            <div className="bg-white rounded-xl border border-[#eef2f1] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#eef2f1] flex justify-between items-center">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-gray-700">Latest System Requests</h3>
                    <button onClick={() => navigate('/global-requests')} className="text-xs font-semibold text-brand-primary flex items-center gap-1">View all <ArrowRight size={12} /></button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">ID</th><th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Requester</th><th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Date</th><th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eef2f1]">
                        {requests.slice(0,6).map(r => (
                            <RequestRow key={r._id} req={r} onView={id => navigate(`/requests/${id}`)} showRequester />
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic">No requests in the system yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <ActivityFeed limit={10} />
        </div>
    );
};

/* ══════════════════ ROOT SWITCHER ══════════════════ */
const Dashboard = () => {
    const { user } = useAuth();
    if (!user) return null;
    if (user.role === 'admin')   return <AdminDashboard   user={user} />;
    if (user.role === 'manager') return <ManagerDashboard user={user} />;
    return <EmployeeDashboard user={user} />;
};

export default Dashboard;
