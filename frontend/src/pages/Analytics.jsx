import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, Clock, Users, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MetricCard = ({ label, value, subtext, icon: Icon, color, trend }) => (
    <div className="card p-6">
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
            <h4 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">{label}</h4>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary">{value}</span>
            </div>
            <p className="text-xs text-text-muted mt-2">{subtext}</p>
        </div>
    </div>
);

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30'); 

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/analytics?days=${period}`);
            setAnalytics(res.data.data.analytics);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                    <div className="h-64 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return <div className="p-8 text-center text-text-muted">No analytics data available</div>;
    }

    const dates = Object.keys(analytics.volumeByDate).sort();
    const volumes = dates.map(date => analytics.volumeByDate[date]);

    const volumeChartData = {
        labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Requests Created',
                data: volumes,
                borderColor: '#1f6f78',
                backgroundColor: 'rgba(31, 111, 120, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const statusChartData = {
        labels: ['Approved', 'Rejected', 'Pending', 'Escalated'],
        datasets: [
            {
                data: [
                    analytics.statusDistribution.approved,
                    analytics.statusDistribution.rejected,
                    analytics.statusDistribution.pending,
                    analytics.statusDistribution.escalated
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#1f6f78',
                    '#f59e0b'
                ],
                borderWidth: 0
            }
        ]
    };

    const templateChartData = {
        labels: analytics.templateUsage.map(t => t.template),
        datasets: [
            {
                label: 'Requests',
                data: analytics.templateUsage.map(t => t.count),
                backgroundColor: '#1f6f78',
                borderRadius: 6
            }
        ]
    };

    const topRequestersChartData = {
        labels: analytics.topRequesters.map(r => r.user),
        datasets: [
            {
                label: 'Requests',
                data: analytics.topRequesters.map(r => r.count),
                backgroundColor: '#6366f1',
                borderRadius: 6
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1c2b2d',
                padding: 12,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { size: 11 } }
            },
            y: {
                grid: { color: '#f3f4f6' },
                ticks: { color: '#9ca3af', font: { size: 11 }, stepSize: 1 },
                beginAtZero: true
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: '#1c2b2d',
                padding: 12,
                cornerRadius: 8
            }
        }
    };

    return (
        <div className="space-y-6">
            {}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Analytics Dashboard</h1>
                    <p className="text-text-secondary mt-1">Data-driven insights and metrics</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="input text-sm py-2"
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="90">Last 90 Days</option>
                </select>
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Total Requests"
                    value={analytics.totalRequests}
                    subtext={`In last ${period} days`}
                    icon={FileText}
                    color="text-brand-primary bg-brand-primary/10"
                />
                <MetricCard
                    label="Avg Approval Time"
                    value={`${analytics.avgApprovalTime}h`}
                    subtext="Average processing time"
                    icon={Clock}
                    color="text-purple-600 bg-purple-100"
                />
                <MetricCard
                    label="SLA Compliance"
                    value={`${analytics.slaCompliance}%`}
                    subtext={`${analytics.slaBreached} breached`}
                    icon={CheckCircle}
                    color="text-emerald-600 bg-emerald-100"
                />
                <MetricCard
                    label="Approval Rate"
                    value={`${analytics.approvalRate}%`}
                    subtext="Of completed requests"
                    icon={TrendingUp}
                    color="text-blue-600 bg-blue-100"
                />
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {}
                <div className="card p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Request Volume Trend</h3>
                    <div className="h-64">
                        <Line data={volumeChartData} options={chartOptions} />
                    </div>
                </div>

                {}
                <div className="card p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Status Distribution</h3>
                    <div className="h-64">
                        <Doughnut data={statusChartData} options={doughnutOptions} />
                    </div>
                </div>

                {}
                <div className="card p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Template Usage</h3>
                    <div className="h-64">
                        {analytics.templateUsage.length > 0 ? (
                            <Bar data={templateChartData} options={chartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-muted">
                                No template data available
                            </div>
                        )}
                    </div>
                </div>

                {}
                <div className="card p-6">
                    <h3 className="font-semibold text-text-primary mb-4">Top Requesters</h3>
                    <div className="h-64">
                        {analytics.topRequesters.length > 0 ? (
                            <Bar data={topRequestersChartData} options={chartOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-text-muted">
                                No requester data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {}
            <div className="card p-6">
                <h3 className="font-semibold text-text-primary mb-4">Detailed Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-semibold text-text-secondary mb-3">Status Breakdown</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-bg-subtle rounded">
                                <span className="text-sm text-text-primary">Approved</span>
                                <span className="text-sm font-semibold text-emerald-600">{analytics.statusDistribution.approved}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-bg-subtle rounded">
                                <span className="text-sm text-text-primary">Rejected</span>
                                <span className="text-sm font-semibold text-red-600">{analytics.statusDistribution.rejected}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-bg-subtle rounded">
                                <span className="text-sm text-text-primary">Pending</span>
                                <span className="text-sm font-semibold text-brand-primary">{analytics.statusDistribution.pending}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-bg-subtle rounded">
                                <span className="text-sm text-text-primary">Escalated</span>
                                <span className="text-sm font-semibold text-orange-600">{analytics.statusDistribution.escalated}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-text-secondary mb-3">Top Templates</h4>
                        <div className="space-y-2">
                            {analytics.templateUsage.slice(0, 5).map((template, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-bg-subtle rounded">
                                    <span className="text-sm text-text-primary truncate">{template.template}</span>
                                    <span className="text-sm font-semibold text-brand-primary">{template.count}</span>
                                </div>
                            ))}
                            {analytics.templateUsage.length === 0 && (
                                <div className="text-sm text-text-muted text-center py-4">No data available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
