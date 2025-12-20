import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Copy, FileText } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const NewRequest = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '' });
    const [isClone, setIsClone] = useState(false);
    const [originalRequestId, setOriginalRequestId] = useState(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/templates');
                setTemplates(res.data.data.templates);

                const cloneDataStr = sessionStorage.getItem('cloneRequestData');
                if (cloneDataStr) {
                    const cloneData = JSON.parse(cloneDataStr);
                    setIsClone(cloneData.isClone);
                    setOriginalRequestId(cloneData.originalRequestId);

                    const template = res.data.data.templates.find(t => t._id === cloneData.templateId);
                    if (template) {
                        setSelectedTemplate(template);
                        
                        formik.setValues(cloneData.formData);
                    }

                    sessionStorage.removeItem('cloneRequestData');
                }
            } catch (err) {
                console.error("Failed to load templates");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const formik = useFormik({
        initialValues: {},
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                await api.post('/requests', {
                    templateId: selectedTemplate._id,
                    formData: values,
                    status: 'submitted'
                });
                navigate('/my-requests');
            } catch (err) {
                setDialog({
                    isOpen: true,
                    type: 'danger',
                    title: 'Submission Failed',
                    message: "We couldn't submit your request: " + (err.response?.data?.message || err.message)
                });
            }
        }
    });

    useEffect(() => {
        if (selectedTemplate) {
            const shape = {};
            const initialVals = {};
            selectedTemplate.formSchema.fields.forEach(field => {
                if (field.required) {
                    shape[field.name] = Yup.string().required(`${field.label} is required`);
                }
                initialVals[field.name] = '';
            });
            formik.setValues(initialVals);
        }
    }, [selectedTemplate]);

    if (loading) return <div>Loading templates...</div>;

    if (!selectedTemplate) {
        
        return (
            <div>
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-text-primary">Create New Request</h1>
                    <p className="text-text-secondary mt-1">Select a request type to proceed</p>
                </div>

                {templates.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 mb-4">
                            <FileText size={32} className="text-brand-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                            No Templates Available
                        </h3>
                        <p className="text-text-secondary mb-6 max-w-md mx-auto">
                            There are no published request templates yet. Please contact your administrator to create templates.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(t => (
                            <div
                                key={t._id}
                                onClick={() => setSelectedTemplate(t)}
                                className="card p-6 cursor-pointer hover:border-brand-primary hover:shadow-md transition-all group"
                            >
                                <h3 className="text-lg font-semibold text-text-primary group-hover:text-brand-primary mb-2">{t.title}</h3>
                                <p className="text-sm text-text-secondary">{t.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {}
                <ConfirmDialog
                    isOpen={dialog.isOpen}
                    onClose={() => setDialog({ ...dialog, isOpen: false })}
                    onConfirm={() => setDialog({ ...dialog, isOpen: false })}
                    title={dialog.title}
                    message={dialog.message}
                    type={dialog.type}
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => setSelectedTemplate(null)} className="flex items-center text-text-muted hover:text-text-primary mb-6 transition-colors text-sm">
                <ArrowLeft size={16} className="mr-1" /> Back to Templates
            </button>

            <div className="card p-8">
                <div className="mb-8 border-b border-border-light pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-semibold text-text-primary">{selectedTemplate.title}</h1>
                        {isClone && (
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                <Copy size={12} />
                                Cloned Request
                            </span>
                        )}
                    </div>
                    <p className="text-text-secondary">{selectedTemplate.description}</p>
                    {isClone && (
                        <p className="text-xs text-purple-600 mt-2">
                            📋 This form has been pre-filled from request #{originalRequestId?.slice(-6)}. You can edit any field before submitting.
                        </p>
                    )}
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    {selectedTemplate.formSchema.fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                {field.label} {field.required && <span className="text-danger">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    className="input min-h-[100px]"
                                    onChange={formik.handleChange}
                                    value={formik.values[field.name] || ''}
                                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    name={field.name}
                                    className="input"
                                    onChange={formik.handleChange}
                                    value={formik.values[field.name] || ''}
                                >
                                    <option value="">Select an option</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    name={field.name}
                                    className="input"
                                    onChange={formik.handleChange}
                                    value={formik.values[field.name] || ''}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                />
                            )}
                        </div>
                    ))}

                    <div className="pt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setSelectedTemplate(null)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            <Send size={16} /> Submit Request
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
                onConfirm={() => setDialog({ ...dialog, isOpen: false })}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
            />
        </div>
    );
};

export default NewRequest;
