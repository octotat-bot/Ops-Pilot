import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, X, ExternalLink, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Icon and color per notification type
const TYPE_CONFIG = {
    approval_needed: { icon: Clock,         color: 'text-blue-500',   bg: 'bg-blue-50' },
    request_update:  { icon: CheckCircle,   color: 'text-emerald-500', bg: 'bg-emerald-50' },
    sla_breach:      { icon: AlertTriangle, color: 'text-orange-500',  bg: 'bg-orange-50' },
    escalation:      { icon: AlertCircle,   color: 'text-red-500',     bg: 'bg-red-50' },
};

const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const NotificationCenter = () => {
    const [isOpen, setIsOpen]             = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]   = useState(0);
    const [loading, setLoading]           = useState(false);
    const dropdownRef = useRef(null);
    const navigate    = useNavigate();

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            const data = res.data.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    }, []);

    // Poll every 30 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => setIsOpen(prev => !prev);

    const handleNotificationClick = async (notification) => {
        // Mark individual as read
        if (!notification.isRead) {
            try {
                await api.patch(`/notifications/${notification._id}/read`);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) { /* non-fatal */ }
        }

        // Navigate to the related request
        if (notification.referenceId) {
            setIsOpen(false);
            navigate(`/requests/${notification.referenceId}`);
        }
    };

    const markAllRead = async () => {
        setLoading(true);
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Mark all read failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                id="notification-bell"
                onClick={handleOpen}
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-all"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-border-light z-50 animate-scale-in">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-text-primary">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={loading}
                                    className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                    <Check size={12} />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-text-muted hover:text-text-primary p-1 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-10 text-center text-text-muted">
                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm font-medium">All caught up!</p>
                                <p className="text-xs mt-1">No notifications yet.</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const cfg   = TYPE_CONFIG[n.type] || TYPE_CONFIG.request_update;
                                const Icon  = cfg.icon;
                                const hasLink = !!n.referenceId;

                                return (
                                    <div
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={`px-4 py-3 border-b border-border-light transition-colors
                                            ${hasLink ? 'cursor-pointer hover:bg-bg-subtle' : ''}
                                            ${!n.isRead ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Type icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                                <Icon size={14} className={cfg.color} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-xs text-text-muted mt-0.5">
                                                    {timeAgo(n.createdAt)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {!n.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                )}
                                                {hasLink && (
                                                    <ExternalLink size={12} className="text-text-muted" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-border-light text-center">
                            <p className="text-xs text-text-muted">
                                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
