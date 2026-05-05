import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell, Check, X, ExternalLink,
    AlertCircle, CheckCircle, Clock, AlertTriangle, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

/* ── per-type visual config ── */
const TYPE_CFG = {
    approval_needed: {
        icon: Clock,
        iconCls: 'text-blue-600',
        bg: 'bg-blue-100',
        label: 'Action needed',
        labelCls: 'text-blue-600 bg-blue-50',
    },
    request_update: {
        icon: CheckCircle,
        iconCls: 'text-emerald-600',
        bg: 'bg-emerald-100',
        label: 'Updated',
        labelCls: 'text-emerald-700 bg-emerald-50',
    },
    sla_breach: {
        icon: AlertTriangle,
        iconCls: 'text-amber-600',
        bg: 'bg-amber-100',
        label: 'SLA breach',
        labelCls: 'text-amber-700 bg-amber-50',
    },
    escalation: {
        icon: AlertCircle,
        iconCls: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Escalated',
        labelCls: 'text-red-700 bg-red-50',
    },
};
const FALLBACK_CFG = {
    icon: Info,
    iconCls: 'text-gray-500',
    bg: 'bg-gray-100',
    label: 'Notice',
    labelCls: 'text-gray-600 bg-gray-50',
};

/* ── relative time helper ── */
const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60)   return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

/* ══════════════════════════════════════════════════════════ */

const NotificationCenter = () => {
    const [isOpen,         setIsOpen]         = useState(false);
    const [notifications,  setNotifications]  = useState([]);
    const [unreadCount,    setUnreadCount]     = useState(0);
    const [markingAll,     setMarkingAll]      = useState(false);
    const dropdownRef = useRef(null);
    const navigate    = useNavigate();

    /* fetch */
    const fetchNotifications = useCallback(async () => {
        try {
            const res  = await api.get('/notifications');
            const data = res.data.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const t = setInterval(fetchNotifications, 30000);
        return () => clearInterval(t);
    }, [fetchNotifications]);

    /* close on outside click */
    useEffect(() => {
        const h = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    /* click single notification */
    const handleClick = async (n) => {
        if (!n.isRead) {
            try {
                await api.patch(`/notifications/${n._id}/read`);
                setNotifications(prev =>
                    prev.map(x => x._id === n._id ? { ...x, isRead: true } : x)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch { /* non-fatal */ }
        }
        if (n.referenceId) {
            setIsOpen(false);
            navigate(`/requests/${n.referenceId}`);
        }
    };

    /* mark all read */
    const markAllRead = async () => {
        if (markingAll || unreadCount === 0) return;
        setMarkingAll(true);
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* non-fatal */ }
        finally { setMarkingAll(false); }
    };

    const unread = notifications.filter(n => !n.isRead);
    const read   = notifications.filter(n =>  n.isRead);

    return (
        <div className="relative" ref={dropdownRef}>

            {/* ── Bell button ── */}
            <button
                id="notification-bell"
                onClick={() => setIsOpen(p => !p)}
                aria-label="Open notifications"
                className={`relative p-2 rounded-lg transition-all
                    ${isOpen
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                    }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span
                        key={unreadCount}
                        className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1
                            bg-red-500 text-white text-[10px] font-bold rounded-full
                            flex items-center justify-center
                            ring-2 ring-white animate-bounce"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ── Dropdown panel ── */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-3 w-[400px] bg-white rounded-2xl
                        shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-gray-100 z-50
                        overflow-hidden"
                    style={{ animation: 'slideDown 0.18s ease' }}
                >
                    {/* Header */}
                    <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                            <span className="font-bold text-[15px] text-gray-900">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full leading-none">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={markingAll}
                                    className="flex items-center gap-1 text-[12px] font-semibold
                                        text-brand-primary hover:text-brand-primary/80 px-2 py-1
                                        rounded-lg hover:bg-brand-primary/5 transition-colors
                                        disabled:opacity-40"
                                >
                                    <Check size={12} />
                                    {markingAll ? 'Marking…' : 'Mark all read'}
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Bell size={24} className="text-gray-400" />
                                </div>
                                <p className="text-[14px] font-semibold text-gray-700">All caught up!</p>
                                <p className="text-[12px] text-gray-400 mt-1">You have no notifications right now.</p>
                            </div>
                        ) : (
                            <>
                                {/* Unread section */}
                                {unread.length > 0 && (
                                    <div>
                                        <p className="px-5 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                            New
                                        </p>
                                        {unread.map(n => (
                                            <NotifItem key={n._id} n={n} onClick={handleClick} />
                                        ))}
                                    </div>
                                )}

                                {/* Read section */}
                                {read.length > 0 && (
                                    <div>
                                        {unread.length > 0 && (
                                            <p className="px-5 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-100">
                                                Earlier
                                            </p>
                                        )}
                                        {read.map(n => (
                                            <NotifItem key={n._id} n={n} onClick={handleClick} />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
                            <span className="text-[11px] text-gray-400">
                                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                            </span>
                            <button
                                onClick={() => { setIsOpen(false); navigate('/dashboard'); }}
                                className="text-[12px] font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
                            >
                                View dashboard →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Slide-down animation */}
            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
            `}</style>
        </div>
    );
};

/* ── Single notification row ── */
const NotifItem = ({ n, onClick }) => {
    const cfg  = TYPE_CFG[n.type] || FALLBACK_CFG;
    const Icon = cfg.icon;

    return (
        <div
            onClick={() => onClick(n)}
            className={`group relative flex items-start gap-3 px-5 py-3.5
                border-b border-gray-50 transition-all duration-150
                ${n.referenceId ? 'cursor-pointer' : ''}
                ${!n.isRead ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-gray-50'}`}
        >
            {/* Unread indicator bar */}
            {!n.isRead && (
                <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-blue-500 rounded-r-full" />
            )}

            {/* Icon pill */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} mt-0.5`}>
                <Icon size={16} className={cfg.iconCls} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Type badge */}
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md mb-1 ${cfg.labelCls}`}>
                    {cfg.label}
                </span>

                <p className={`text-[13px] leading-snug break-words
                    ${!n.isRead ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'}`}>
                    {n.message}
                </p>

                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 pt-0.5">
                {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                {n.referenceId && (
                    <ExternalLink
                        size={13}
                        className="text-gray-300 group-hover:text-brand-primary transition-colors"
                    />
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
