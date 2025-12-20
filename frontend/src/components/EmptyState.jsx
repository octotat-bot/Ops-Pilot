import React from 'react';
import { FileText, CheckSquare, Users, FileCode, Activity, Inbox } from 'lucide-react';

const EmptyState = ({ type = 'default', onAction, actionLabel, actionIcon: ActionIcon }) => {
    const getConfig = () => {
        switch (type) {
            case 'requests':
                return {
                    icon: FileText,
                    title: 'No requests yet',
                    message: "You haven't created any requests.",
                    tip: '💡 Tip: Use templates for faster submissions',
                    actionLabel: actionLabel || 'Create Your First Request'
                };
            case 'approvals':
                return {
                    icon: CheckSquare,
                    title: 'No pending approvals',
                    message: 'All caught up! No requests waiting for your approval.',
                    tip: '✨ Great job staying on top of things!',
                    actionLabel: null
                };
            case 'delegations':
                return {
                    icon: Users,
                    title: 'No delegations',
                    message: "You haven't created any delegations yet.",
                    tip: '💡 Tip: Delegate approvals during vacation or high workload',
                    actionLabel: actionLabel || 'Create Delegation'
                };
            case 'templates':
                return {
                    icon: FileCode,
                    title: 'No templates available',
                    message: 'No request templates have been created yet.',
                    tip: '💡 Tip: Templates make request submission faster and more consistent',
                    actionLabel: actionLabel || 'Create Template'
                };
            case 'activity':
                return {
                    icon: Activity,
                    title: 'No recent activity',
                    message: 'No activity to display yet.',
                    tip: '📊 Activity will appear here as you use the system',
                    actionLabel: null
                };
            default:
                return {
                    icon: Inbox,
                    title: 'No data available',
                    message: 'There is no data to display at this time.',
                    tip: '',
                    actionLabel: actionLabel
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;
    const ButtonIcon = ActionIcon || Icon;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            {}
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Icon size={40} className="text-gray-400" />
            </div>

            {}
            <h3 className="text-xl font-semibold text-text-primary mb-2">
                {config.title}
            </h3>

            {}
            <p className="text-text-secondary mb-4 max-w-md">
                {config.message}
            </p>

            {}
            {config.tip && (
                <p className="text-sm text-text-muted mb-6 max-w-md bg-bg-subtle px-4 py-2 rounded-lg">
                    {config.tip}
                </p>
            )}

            {}
            {config.actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                    <ButtonIcon size={18} />
                    {config.actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
