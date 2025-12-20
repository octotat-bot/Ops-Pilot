import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, type = 'danger', inputRequired = false, inputPlaceholder = 'Add a comment...', confirmText = 'Confirm Action', cancelText = 'Cancel' }) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (!isOpen) setComment('');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {}
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={clsx("p-3 rounded-full flex-shrink-0",
                            type === 'danger' ? "bg-red-50 text-red-600" :
                                type === 'success' ? "bg-green-50 text-green-600" :
                                    "bg-brand-primary/10 text-brand-primary"
                        )}>
                            {type === 'danger' && <AlertTriangle size={24} />}
                            {type === 'success' && <CheckCircle size={24} />}
                            {type === 'info' && <Info size={24} />}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-[#1c2b2d]">{title}</h3>
                            <p className="text-[#6f8487] mt-1 text-sm leading-relaxed">{message}</p>

                            {inputRequired && (
                                <div className="mt-4">
                                    <textarea
                                        className="w-full border border-[#d9e1e0] rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none resize-none"
                                        rows={3}
                                        placeholder={inputPlaceholder}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <button onClick={onClose} className="text-[#6f8487] hover:text-[#1c2b2d]">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-[#f8faf9] px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t border-[#eef2f1]">
                    {cancelText && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#6f8487] hover:text-[#1c2b2d] transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => onConfirm(comment)}
                        className={clsx("px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm",
                            type === 'danger' ? "bg-red-600 hover:bg-red-700" :
                                type === 'success' ? "bg-emerald-600 hover:bg-emerald-700" :
                                    "bg-brand-primary hover:bg-[#16555c]"
                        )}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
