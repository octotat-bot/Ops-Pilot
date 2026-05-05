import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import {
    FileText,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Settings,
    UserPlus,
    Activity as ActivityIcon
} from 'lucide-react';

const ActivityFeed = ({ limit = 10 }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await api.get(`/activity?limit=${limit}`);
                setActivities(res.data.data.activities);
            } catch (err) {
                console.error('Failed to fetch activities', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();

        const interval = setInterval(fetchActivities, 30000);
        return () => clearInterval(interval);
    }, [limit]);

    const getIcon = (type) => {
        switch (type) {
            case 'request_created':
                return <FileText size={16} className="text-brand-primary" />;
            case 'request_approved':
                return <CheckCircle size={16} className="text-emerald-600" />;
            case 'request_rejected':
                return <XCircle size={16} className="text-red-600" />;
            case 'request_escalated':
                return <AlertTriangle size={16} className="text-orange-600" />;
            case 'template_created':
            case 'template_updated':
                return <Settings size={16} className="text-purple-600" />;
            case 'user_registered':
                return <UserPlus size={16} className="text-blue-600" />;
            default:
                return <ActivityIcon size={16} className="text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 bg-gray-200 rounded w-36 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex items-start gap-3 p-3 animate-pulse">
                            <div className="w-4 h-4 bg-gray-200 rounded-full mt-0.5 flex-shrink-0"></div>
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3.5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-24"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
                <ActivityIcon size={18} className="text-text-muted" />
            </div>

            {activities.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                    <ActivityIcon size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-slick">
                    {activities.map((activity) => (
                        <div
                            key={activity._id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-subtle/50 transition-colors"
                        >
                            <div className="mt-0.5 flex-shrink-0">
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary">
                                    {activity.message}
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
