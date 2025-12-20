import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    const getStatusConfig = () => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return {
                    icon: CheckCircle2,
                    label: 'Approved',
                    className: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200',
                    iconColor: 'text-emerald-600'
                };
            case 'rejected':
                return {
                    icon: XCircle,
                    label: 'Rejected',
                    className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200',
                    iconColor: 'text-red-600'
                };
            case 'pending':
                return {
                    icon: Clock,
                    label: 'Pending',
                    className: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200 badge-pending',
                    iconColor: 'text-yellow-600'
                };
            case 'submitted':
                return {
                    icon: AlertCircle,
                    label: 'Submitted',
                    className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200',
                    iconColor: 'text-blue-600'
                };
            default:
                return {
                    icon: AlertCircle,
                    label: status || 'Unknown',
                    className: 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200',
                    iconColor: 'text-gray-600'
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.className} transition-all duration-200`}>
            <Icon size={14} className={config.iconColor} />
            {config.label}
        </span>
    );
};

export default StatusBadge;
