import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart3, TrendingUp, Users, FileText, Clock, AlertTriangle, Activity } from 'lucide-react';

const AdvancedAnalytics = () => {
    const [activeTab, setActiveTab] = useState('bottlenecks');
    const [period, setPeriod] = useState(30);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchData();
    }, [activeTab, period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            switch (activeTab) {
                case 'bottlenecks':
                    endpoint = '/analytics/bottlenecks';
                    break;
                case 'approvers':
                    endpoint = '/analytics/approver-performance';
                    break;
                case 'templates':
                    endpoint = '/analytics/template-statistics';
                    break;
                case 'sla':
                    endpoint = '/analytics/sla-compliance';
                    break;
                case 'trends':
                    endpoint = '/analytics/trends';
                    break;
                default:
                    endpoint = '/analytics';
            }

            const res = await api.get(`${endpoint}?days=${period}`);
            setData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'bottlenecks', label: 'Bottleneck Analysis', icon: AlertTriangle },
        { id: 'approvers', label: 'Approver Performance', icon: Users },
        { id: 'templates', label: 'Template Statistics', icon: FileText },
        { id: 'sla', label: 'SLA Compliance', icon: Clock },
        { id: 'trends', label: 'Trend Analysis', icon: TrendingUp }
    ];

    return (
        <div className="space-y-6">
            {}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
                        <BarChart3 size={28} className="text-brand-primary" />
                        Advanced Analytics
                    </h1>
                    <p className="text-text-secondary mt-1">Deep insights into workflow performance and efficiency</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(parseInt(e.target.value))}
                    className="input w-40"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                </select>
            </div>

            {}
            <div className="border-b border-border-light">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-brand-primary text-brand-primary'
                                        : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {}
            <div className="card p-6">
                {loading ? (
                    <div className="text-center py-12 text-text-muted">
                        <Activity size={32} className="mx-auto mb-2 animate-spin" />
                        <p>Loading analytics...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'bottlenecks' && <BottleneckAnalysis data={data} />}
                        {activeTab === 'approvers' && <ApproverPerformance data={data} />}
                        {activeTab === 'templates' && <TemplateStatistics data={data} />}
                        {activeTab === 'sla' && <SLACompliance data={data} />}
                        {activeTab === 'trends' && <TrendAnalysis data={data} />}
                    </>
                )}
            </div>
        </div>
    );
};

const BottleneckAnalysis = ({ data }) => {
    if (!data?.bottlenecks || data.bottlenecks.length === 0) {
        return <div className="text-center py-8 text-text-muted">No bottleneck data available</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Approval Stage Bottlenecks</h3>
                <p className="text-sm text-text-secondary">Stages sorted by average processing time (slowest first)</p>
            </div>

            <div className="space-y-3">
                {data.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="p-4 border border-border-light rounded-lg bg-bg-subtle/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-danger/10 text-danger' :
                                        index === 1 ? 'bg-warning/10 text-warning' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-semibold text-text-primary">{bottleneck.role} Approval</div>
                                    <div className="text-xs text-text-muted">{bottleneck.uniqueApprovers} approvers</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-text-primary">{bottleneck.avgTimeHours}h</div>
                                <div className="text-xs text-text-muted">Avg time</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-text-muted">Total Requests</div>
                                <div className="font-semibold text-text-primary">{bottleneck.totalRequests}</div>
                            </div>
                            <div>
                                <div className="text-text-muted">Approved</div>
                                <div className="font-semibold text-success">{bottleneck.approvedCount}</div>
                            </div>
                            <div>
                                <div className="text-text-muted">Approval Rate</div>
                                <div className="font-semibold text-text-primary">{bottleneck.approvalRate}%</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ApproverPerformance = ({ data }) => {
    if (!data?.performance || data.performance.length === 0) {
        return <div className="text-center py-8 text-text-muted">No approver performance data available</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Approver Performance Metrics</h3>
                <p className="text-sm text-text-secondary">Individual approver statistics and efficiency</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-bg-subtle text-xs uppercase text-text-muted font-semibold">
                        <tr>
                            <th className="px-4 py-3 text-left">Approver</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-center">Processed</th>
                            <th className="px-4 py-3 text-center">Approved</th>
                            <th className="px-4 py-3 text-center">Rejected</th>
                            <th className="px-4 py-3 text-center">Approval Rate</th>
                            <th className="px-4 py-3 text-center">Avg Response</th>
                            <th className="px-4 py-3 text-center">Median Response</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {data.performance.map((approver, index) => (
                            <tr key={index} className="hover:bg-bg-subtle/30">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-text-primary">{approver.approver}</div>
                                    <div className="text-xs text-text-muted">{approver.email}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs font-medium rounded">
                                        {approver.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-text-primary">{approver.totalProcessed}</td>
                                <td className="px-4 py-3 text-center text-success font-semibold">{approver.totalApprovals}</td>
                                <td className="px-4 py-3 text-center text-danger font-semibold">{approver.totalRejections}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${approver.approvalRate >= 80 ? 'bg-success/10 text-success' :
                                            approver.approvalRate >= 60 ? 'bg-warning/10 text-warning' :
                                                'bg-danger/10 text-danger'
                                        }`}>
                                        {approver.approvalRate}%
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center font-semibold text-text-primary">{approver.avgResponseTimeHours}h</td>
                                <td className="px-4 py-3 text-center font-semibold text-text-secondary">{approver.medianResponseTimeHours}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TemplateStatistics = ({ data }) => {
    if (!data?.statistics || data.statistics.length === 0) {
        return <div className="text-center py-8 text-text-muted">No template statistics available</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Template Usage & Performance</h3>
                <p className="text-sm text-text-secondary">Detailed statistics for each template</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.statistics.map((template, index) => (
                    <div key={index} className="p-4 border border-border-light rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-semibold text-text-primary">{template.template}</h4>
                                <p className="text-xs text-text-muted">SLA: {template.slaHours}h</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-text-primary">{template.totalRequests}</div>
                                <div className="text-xs text-text-muted">Total</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                                <div className="text-text-muted">Approved</div>
                                <div className="font-semibold text-success">{template.approved}</div>
                            </div>
                            <div>
                                <div className="text-text-muted">Rejected</div>
                                <div className="font-semibold text-danger">{template.rejected}</div>
                            </div>
                            <div>
                                <div className="text-text-muted">Pending</div>
                                <div className="font-semibold text-warning">{template.pending}</div>
                            </div>
                            <div>
                                <div className="text-text-muted">Escalated</div>
                                <div className="font-semibold text-text-secondary">{template.escalated}</div>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-border-light space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Approval Rate</span>
                                <span className="font-semibold text-text-primary">{template.approvalRate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">SLA Compliance</span>
                                <span className={`font-semibold ${template.slaComplianceRate >= 90 ? 'text-success' : template.slaComplianceRate >= 70 ? 'text-warning' : 'text-danger'}`}>
                                    {template.slaComplianceRate}%
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Avg Processing Time</span>
                                <span className="font-semibold text-text-primary">{template.avgProcessingTimeHours}h</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SLACompliance = ({ data }) => {
    if (!data?.overall) {
        return <div className="text-center py-8 text-text-muted">No SLA compliance data available</div>;
    }

    return (
        <div className="space-y-6">
            {}
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Overall SLA Compliance</h3>
                <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 border border-border-light rounded-lg">
                        <div className="text-text-muted text-sm mb-1">Total Requests</div>
                        <div className="text-2xl font-bold text-text-primary">{data.overall.totalRequests}</div>
                    </div>
                    <div className="p-4 border border-border-light rounded-lg bg-success/5">
                        <div className="text-text-muted text-sm mb-1">On Time</div>
                        <div className="text-2xl font-bold text-success">{data.overall.onTimeRequests}</div>
                    </div>
                    <div className="p-4 border border-border-light rounded-lg bg-danger/5">
                        <div className="text-text-muted text-sm mb-1">Breached</div>
                        <div className="text-2xl font-bold text-danger">{data.overall.breachedRequests}</div>
                    </div>
                    <div className="p-4 border border-border-light rounded-lg bg-brand-primary/5">
                        <div className="text-text-muted text-sm mb-1">Compliance Rate</div>
                        <div className="text-2xl font-bold text-brand-primary">{data.overall.complianceRate}%</div>
                    </div>
                </div>
            </div>

            {}
            {data.templateCompliance && data.templateCompliance.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">SLA Compliance by Template</h3>
                    <div className="space-y-2">
                        {data.templateCompliance.map((template, index) => (
                            <div key={index} className="p-3 border border-border-light rounded-lg flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-text-primary">{template.template}</div>
                                    <div className="text-xs text-text-muted">{template.onTime} on time, {template.breached} breached</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${template.complianceRate >= 90 ? 'bg-success' : template.complianceRate >= 70 ? 'bg-warning' : 'bg-danger'}`}
                                            style={{ width: `${template.complianceRate}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-16 text-right font-semibold text-text-primary">{template.complianceRate}%</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {}
            {data.recentBreaches && data.recentBreaches.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Recent SLA Breaches</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-bg-subtle text-xs uppercase text-text-muted font-semibold">
                                <tr>
                                    <th className="px-4 py-3 text-left">Template</th>
                                    <th className="px-4 py-3 text-left">Requester</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                    <th className="px-4 py-3 text-left">Deadline</th>
                                    <th className="px-4 py-3 text-center">Days Overdue</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {data.recentBreaches.map((breach, index) => (
                                    <tr key={index} className="hover:bg-bg-subtle/30">
                                        <td className="px-4 py-3 text-text-primary">{breach.template}</td>
                                        <td className="px-4 py-3 text-text-secondary">{breach.requester}</td>
                                        <td className="px-4 py-3 text-text-secondary text-sm">{new Date(breach.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-text-secondary text-sm">{new Date(breach.slaDeadline).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="px-2 py-1 bg-danger/10 text-danger text-xs font-semibold rounded">
                                                +{breach.daysOverdue}d
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${breach.status === 'approved' ? 'bg-success/10 text-success' :
                                                    breach.status === 'rejected' ? 'bg-danger/10 text-danger' :
                                                        'bg-warning/10 text-warning'
                                                }`}>
                                                {breach.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrendAnalysis = ({ data }) => {
    if (!data?.weeklyTrends || data.weeklyTrends.length === 0) {
        return <div className="text-center py-8 text-text-muted">No trend data available</div>;
    }

    return (
        <div className="space-y-6">
            {}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-border-light rounded-lg">
                    <div className="text-text-muted text-sm mb-1">Growth Rate</div>
                    <div className={`text-2xl font-bold ${data.insights.growthRate >= 0 ? 'text-success' : 'text-danger'}`}>
                        {data.insights.growthRate >= 0 ? '+' : ''}{data.insights.growthRate}%
                    </div>
                </div>
                <div className="p-4 border border-border-light rounded-lg">
                    <div className="text-text-muted text-sm mb-1">Total Requests</div>
                    <div className="text-2xl font-bold text-text-primary">{data.insights.totalRequests}</div>
                </div>
                <div className="p-4 border border-border-light rounded-lg">
                    <div className="text-text-muted text-sm mb-1">Avg Weekly Volume</div>
                    <div className="text-2xl font-bold text-text-primary">{data.insights.avgWeeklyVolume}</div>
                </div>
            </div>

            {}
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Weekly Trends</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-subtle text-xs uppercase text-text-muted font-semibold">
                            <tr>
                                <th className="px-4 py-3 text-left">Week Starting</th>
                                <th className="px-4 py-3 text-center">Total</th>
                                <th className="px-4 py-3 text-center">Approved</th>
                                <th className="px-4 py-3 text-center">Rejected</th>
                                <th className="px-4 py-3 text-center">Pending</th>
                                <th className="px-4 py-3 text-center">Approval Rate</th>
                                <th className="px-4 py-3 text-center">Avg Processing Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {data.weeklyTrends.map((week, index) => (
                                <tr key={index} className="hover:bg-bg-subtle/30">
                                    <td className="px-4 py-3 text-text-primary">{new Date(week.week).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-center font-semibold text-text-primary">{week.total}</td>
                                    <td className="px-4 py-3 text-center text-success font-semibold">{week.approved}</td>
                                    <td className="px-4 py-3 text-center text-danger font-semibold">{week.rejected}</td>
                                    <td className="px-4 py-3 text-center text-warning font-semibold">{week.pending}</td>
                                    <td className="px-4 py-3 text-center font-semibold text-text-primary">{week.approvalRate}%</td>
                                    <td className="px-4 py-3 text-center font-semibold text-text-secondary">{week.avgProcessingTimeHours}h</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
