import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/activity?limit=10');
            const activities = res.data.data.activities || [];

            // Filter out notifications cleared by user (stored in localStorage)
            const lastClearedTime = localStorage.getItem('notificationsLastCleared');
            const visibleNotifications = lastClearedTime
                ? activities.filter(a => new Date(a.createdAt) > new Date(lastClearedTime))
                : activities;

            setNotifications(visibleNotifications);

            // Count unread (logic: newer than last view? or just exist?)
            // For now, let's treat all visible notifications as "unread/new" if we cleared the old ones
            setUnreadCount(Math.min(visibleNotifications.length, 9));
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    const handleNotificationClick = (notification) => {
        if (notification.metadata?.request) {
            setIsOpen(false);
            navigate(`/requests/${notification.metadata.request}`);
        }
    };

    const clearAll = () => {
        const now = new Date().toISOString();
        localStorage.setItem('notificationsLastCleared', now);
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
    };

    const formatNotificationTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-bg-subtle rounded-lg transition-all"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-ring">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-border-light z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Clear all
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-text-muted hover:text-text-primary p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto scrollbar-slick">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-text-muted">
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification, idx) => (
                                <div
                                    key={notification._id || idx}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`px-4 py-3 border-b border-border-light hover:bg-bg-subtle transition-colors ${notification.metadata?.request ? 'cursor-pointer' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-sm text-text-primary font-medium mb-1">
                                                {notification.description}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {formatNotificationTime(notification.createdAt)}
                                            </p>
                                        </div>
                                        {notification.metadata?.request && (
                                            <ExternalLink size={14} className="text-text-muted flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-border-light">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                navigate('/dashboard');
                            }}
                            className="text-sm text-brand-primary hover:text-brand-primary/80 font-medium w-full text-center"
                        >
                            View all activity →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
