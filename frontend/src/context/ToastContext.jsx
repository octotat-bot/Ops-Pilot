import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const getConfig = () => {
        switch (toast.type) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    iconColor: 'text-emerald-600'
                };
            case 'error':
                return {
                    icon: XCircle,
                    className: 'bg-red-50 border-red-200 text-red-800',
                    iconColor: 'text-red-600'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                    iconColor: 'text-yellow-600'
                };
            default:
                return {
                    icon: Info,
                    className: 'bg-blue-50 border-blue-200 text-blue-800',
                    iconColor: 'text-blue-600'
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${config.className} animate-slide-in-right pointer-events-auto min-w-[320px] max-w-md`}>
            <Icon size={20} className={`flex-shrink-0 ${config.iconColor}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastProvider;
