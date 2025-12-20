import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    TrendingUp,
    Activity,
    FileText,
    AlertOctagon,
    LayoutDashboard,
    PlusCircle,
    BarChart2,
    Users
} from 'lucide-react';
import { format } from 'date-fns';
import ActivityFeed from '../components/ActivityFeed';
import OnboardingTour from '../components/OnboardingTour';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const tourSteps = [
    {
        title: 'Welcome to OpsPilot! 🎉',
        description: 'Let us show you around and help you get started with managing your operational workflows.',
        icon: LayoutDashboard,
        content: (
            <div className="text-sm space-y-2">
                <p>OpsPilot helps you:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    <li>Submit and track requests</li>
                    <li>Manage approvals efficiently</li>
                    <li>Monitor team activity</li>
                    <li>Analyze workflow metrics</li>
                </ul>
            </div>
        )
    },
    {
        title: 'Dashboard Overview',
        description: 'This is your command center. Here you can see all your key metrics at a glance.',
        icon: LayoutDashboard,
        content: (
            <p className="text-sm text-text-secondary">
                Monitor pending requests, approvals, and recent activity all in one place.
            </p>
        )
    },
    {
        title: 'Create New Requests',
        description: 'Click the "New Request" button in the sidebar to submit a new request using templates.',
        icon: PlusCircle,
        content: (
            <p className="text-sm text-text-secondary">
                Templates make it easy to submit consistent, well-structured requests.
            </p>
        )
    },
    {
        title: 'Track Your Requests',
        description: 'View all your submitted requests in "My Requests" section.',
        icon: FileText,
        content: (
            <p className="text-sm text-text-secondary">
                Monitor status, view details, and clone previous requests for faster submission.
            </p>
        )
    },
    {
        title: 'Analytics & Insights',
        description: 'Access powerful analytics to understand your workflow performance.',
        icon: BarChart2,
        content: (
            <p className="text-sm text-text-secondary">
                View trends, bottlenecks, SLA compliance, and more in the Analytics section.
            </p>
        )
    },
    {
        title: 'You\'re All Set! ✨',
        description: 'You now know the basics. Start exploring and make the most of OpsPilot!',
        icon: CheckCircle2,
        content: (
            <div className="text-sm space-y-2">
                <p className="text-text-secondary">Need help? Check out:</p>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    <li>Your profile settings</li>
                    <li>Notification center (bell icon)</li>
                    <li>Activity feed for recent updates</li>
                </ul>
            </div>
        )
    }
];

const MetricCard = ({ label, value, subtext, icon: Icon, trend, color, active }) => (
    <div className={`relative overflow-hidden p-6 rounded-xl border transition-all duration-200 ${active ? 'bg-white border-brand-primary/30 ring-2 ring-brand-primary/5 shadow-lg shadow-brand-primary/5' : 'bg-white border-[#eef2f1] hover:border-brand-primary/20 hover:shadow-md'}`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={20} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                    <TrendingUp size={12} />
                    {trend}
                </div>
            )}
        </div>
        <div>
            <h4 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1 opacity-80">{label}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary tracking-tight">{value}</span>
            </div>
            <p className="text-xs text-text-muted mt-2 font-medium">{subtext}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ active: 0, actionsRequired: 0, overdue: 0, completed: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                
                const [myRequestsRes, myApprovalsRes, analyticsRes] = await Promise.all([
                    api.get('/requests/me'),
                    api.get('/requests/approvals'),
                    api.get('/analytics?days=7') 
                ]);

                const requests = myRequestsRes.data.data.requests;
                const approvals = myApprovalsRes.data.data.approvals || [];
                const analytics = analyticsRes.data.data.analytics;

                const active = requests.filter(r => !['approved', 'rejected'].includes(r.status)).length;

                const actionsRequired = approvals.length;

                const completed = requests.filter(r => ['approved', 'rejected'].includes(r.status)).length;

                const myBreachedRequests = requests.filter(r => r.isSlaBreached).length;
                const overdue = myBreachedRequests;

                setStats({ active, actionsRequired, overdue, completed });
                setRecentRequests(requests.slice(0, 5));

                const dates = Object.keys(analytics.volumeByDate).sort();
                const last7Days = dates.slice(-7);

                const labels = last7Days.map(date => {
                    const d = new Date(date);
                    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
                });

                const volumes = last7Days.map(date => analytics.volumeByDate[date] || 0);

                const approvalCounts = last7Days.map(date => {
                    const statusData = analytics.statusByDate[date];
                    if (!statusData) return 0;
                    return (statusData.approved || 0) + (statusData.rejected || 0);
                });

                setChartData({
                    labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'New Requests',
                            data: volumes.length > 0 ? volumes : [0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#1f6f78',
                            backgroundColor: 'rgba(31, 111, 120, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                        },
                        {
                            label: 'Approvals',
                            data: approvalCounts.length > 0 ? approvalCounts : [0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#9ca3af',
                            borderDash: [5, 5],
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                        }
                    ],
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                
                setChartData({
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                        {
                            label: 'New Requests',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#1f6f78',
                            backgroundColor: 'rgba(31, 111, 120, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                        },
                        {
                            label: 'Approvals',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: '#9ca3af',
                            borderDash: [5, 5],
                            backgroundColor: 'transparent',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                        }
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    font: { size: 11, family: 'Inter, sans-serif' }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#1c2b2d',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { size: 11 } }
            },
            y: {
                grid: { color: '#f3f4f6' },
                ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 2 }
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
    }

    return (
        <div className="space-y-8">
            {}
            <OnboardingTour
                steps={tourSteps}
                storageKey="dashboard_tour_completed"
                onComplete={(completed) => {
                    if (completed) {
                        console.log('User completed the tour!');
                    }
                }}
            />

            {}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1c2b2d] tracking-tight">Overview</h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Welcome back, {user?.name}. Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-white border border-[#eef2f1] text-text-secondary text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-primary/50 shadow-sm cursor-pointer hover:border-brand-primary/20">
                        <option>Last 7 Days</option>
                        <option>This Month</option>
                        <option>This Quarter</option>
                    </select>
                    <button className="bg-white border border-[#eef2f1] text-text-secondary text-sm rounded-lg px-3 py-2 shadow-sm hover:text-brand-primary flex items-center gap-2">
                        <Activity size={16} /> Reports
                    </button>
                </div>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    label="Active Workflows"
                    value={stats.active}
                    subtext="My Requests in progress"
                    icon={Activity}
                    color="text-brand-primary bg-brand-primary/10"
                    active={true}
                />
                <MetricCard
                    label="Pending Actions"
                    value={stats.actionsRequired}
                    subtext="Awaiting my approval"
                    icon={Clock}
                    color="text-orange-600 bg-orange-50"
                />
                <MetricCard
                    label="Critical / Overdue"
                    value={stats.overdue}
                    subtext="SLA breached"
                    icon={AlertOctagon}
                    color="text-red-600 bg-red-50"
                />
                <MetricCard
                    label="Completed"
                    value={stats.completed}
                    subtext="Total completed"
                    icon={CheckCircle2}
                    color="text-emerald-600 bg-emerald-50"
                />
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#eef2f1] shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-[#1c2b2d] text-sm uppercase tracking-wide flex items-center gap-2">
                            Request Volume (Last 7 Days)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        {chartData ? (
                            <Line data={chartData} options={chartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-muted">
                                Loading chart data...
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="bg-white rounded-xl border border-[#eef2f1] shadow-sm p-0 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#eef2f1] bg-[#f8faf9]">
                        <h3 className="font-bold text-[#1c2b2d] text-sm uppercase tracking-wide">
                            System Health
                        </h3>
                    </div>

                    <div className="flex-1 p-5 space-y-6">
                        {stats.actionsRequired === 0 && stats.overdue === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={24} />
                                </div>
                                <h4 className="font-semibold text-[#1c2b2d]">All Systems Operational</h4>
                                <p className="text-sm text-text-muted mt-1">No pending actions required.</p>
                            </div>
                        ) : (
                            <>
                                {stats.overdue > 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                                        <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">SLA Breach Detected</p>
                                            <p className="text-xs text-red-600/80 mt-1">{stats.overdue} requests have exceeded their approval time limit.</p>
                                        </div>
                                    </div>
                                )}
                                {stats.actionsRequired > 0 && (
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-100">
                                        <Clock className="text-orange-500 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-sm font-semibold text-orange-700">Pending Approvals</p>
                                            <p className="text-xs text-orange-600/80 mt-1">{stats.actionsRequired} requests are awaiting review.</p>
                                            <button onClick={() => navigate('/approvals')} className="mt-2 text-xs font-semibold text-orange-700 hover:underline">View Queue →</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {}
            <ActivityFeed limit={15} />

            {}
            <div className="bg-white rounded-xl border border-[#eef2f1] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-[#eef2f1] flex justify-between items-center bg-[#f8faf9]/50">
                    <h3 className="font-bold text-[#1c2b2d] text-sm uppercase tracking-wide">
                        Recent Activity
                    </h3>
                    <button onClick={() => navigate('/my-requests')} className="text-xs font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1">
                        View All History <ArrowRight size={14} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#f9fafb] text-text-muted font-semibold uppercase text-xs border-b border-[#eef2f1]">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Request ID</th>
                                <th className="px-6 py-3 whitespace-nowrap">Type</th>
                                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 whitespace-nowrap">Date</th>
                                <th className="px-6 py-3 whitespace-nowrap text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef2f1]">
                            {recentRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-text-muted italic">
                                        No recent requests found.
                                    </td>
                                </tr>
                            ) : (
                                recentRequests.map(req => (
                                    <tr key={req._id} className="hover:bg-[#f8faf9] transition-colors group">
                                        <td className="px-6 py-4 font-mono text-[#4a5d60] text-xs">
                                            #{req._id.substring(req._id.length - 6).toUpperCase()}
                                            <button
                                                onClick={() => navigate(`/requests/${req._id}`)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary font-medium text-xs bg-brand-primary/5 px-3 py-1.5 rounded hover:bg-brand-primary/10"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
