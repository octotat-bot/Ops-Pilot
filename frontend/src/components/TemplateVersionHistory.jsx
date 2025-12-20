import React, { useState } from 'react';
import api from '../utils/api';
import { History, RotateCcw, X, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const TemplateVersionHistory = ({ template, onClose, onRevert }) => {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revertDialog, setRevertDialog] = useState({ isOpen: false, version: null, reason: '' });

    React.useEffect(() => {
        fetchVersions();
    }, [template._id]);

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/templates/${template._id}/versions`);
            setVersions(res.data.data.versions);
        } catch (err) {
            console.error('Failed to fetch versions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async () => {
        if (!revertDialog.reason.trim()) {
            alert('Please provide a reason for reverting');
            return;
        }

        try {
            await api.post(`/templates/${template._id}/revert/${revertDialog.version.versionNumber}`, {
                changeDescription: revertDialog.reason
            });
            alert('Template reverted successfully!');
            setRevertDialog({ isOpen: false, version: null, reason: '' });
            onRevert();
            onClose();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to revert template');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {}
                <div className="p-6 border-b border-border-light flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History size={24} className="text-brand-primary" />
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary">Version History</h2>
                            <p className="text-sm text-text-secondary">{template.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                        <X size={24} />
                    </button>
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8 text-text-muted">Loading versions...</div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-text-muted">
                            <History size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No version history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versions.map((version, index) => (
                                <div
                                    key={version._id}
                                    className={`p-4 border rounded-lg ${index === 0 ? 'border-brand-primary bg-brand-primary/5' : 'border-border-light'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${index === 0
                                                    ? 'bg-brand-primary text-white'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                v{version.versionNumber}
                                            </div>
                                            {index === 0 && (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        {index !== 0 && (
                                            <button
                                                onClick={() => setRevertDialog({ isOpen: true, version, reason: '' })}
                                                className="btn btn-secondary text-sm flex items-center gap-1"
                                            >
                                                <RotateCcw size={14} /> Revert to this version
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <User size={14} />
                                            <span>{version.changedBy?.name || 'Unknown'}</span>
                                            <span className="text-text-muted">•</span>
                                            <Calendar size={14} />
                                            <span>{format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                        <div className="mt-2">
                                            <strong className="text-text-primary">Change Description:</strong>
                                            <p className="text-text-secondary mt-1">{version.changeDescription}</p>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border-light">
                                            <div className="grid grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <span className="text-text-muted">Title:</span>
                                                    <p className="text-text-primary font-medium">{version.title}</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">SLA Hours:</span>
                                                    <p className="text-text-primary font-medium">{version.slaHours}h</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">Form Fields:</span>
                                                    <p className="text-text-primary font-medium">{version.formFields?.length || 0} fields</p>
                                                </div>
                                                <div>
                                                    <span className="text-text-muted">Approval Stages:</span>
                                                    <p className="text-text-primary font-medium">{version.approvalFlow?.length || 0} stages</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {}
                {revertDialog.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">
                                Revert to Version {revertDialog.version.versionNumber}?
                            </h3>
                            <p className="text-sm text-text-secondary mb-4">
                                This will restore the template to version {revertDialog.version.versionNumber} and create a new version.
                                The current version will be preserved in history.
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Reason for Reverting <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    value={revertDialog.reason}
                                    onChange={(e) => setRevertDialog({ ...revertDialog, reason: e.target.value })}
                                    className="input"
                                    rows="3"
                                    placeholder="e.g., Reverting accidental changes"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRevertDialog({ isOpen: false, version: null, reason: '' })}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRevert}
                                    className="btn btn-primary bg-warning hover:bg-orange-600"
                                >
                                    Revert to v{revertDialog.version.versionNumber}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateVersionHistory;
