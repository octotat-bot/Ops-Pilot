import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Copy, FileText, Loader2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const NewRequest = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dialog, setDialog] = useState({ isOpen: false, type: 'info', title: '', message: '' });
    const [isClone, setIsClone] = useState(false);
    const [originalRequestId, setOriginalRequestId] = useState(null);
    const [cloneData, setCloneData] = useState(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/templates');
                setTemplates(res.data.data.templates);

                const cloneDataStr = sessionStorage.getItem('cloneRequestData');
                if (cloneDataStr) {
                    const parsedCloneData = JSON.parse(cloneDataStr);
                    setIsClone(parsedCloneData.isClone);
                    setOriginalRequestId(parsedCloneData.originalRequestId);

                    const template = res.data.data.templates.find(t => t._id === parsedCloneData.templateId);
                    if (template) {
                        setSelectedTemplate(template);
                        setCloneData(parsedCloneData.formData);
                    }

                    sessionStorage.removeItem('cloneRequestData');
                }
            } catch (err) {
                console.error('Failed to load templates');
                toast.error('Failed to load templates. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    // Dynamically build Yup schema from template fields
    const buildValidationSchema = (fields) => {
        const shape = {};
        fields.forEach(field => {
            let validator = Yup.string();
            if (field.required) {
                validator = validator.required(`${field.label} is required`);
            }
            if (field.type === 'number') {
                validator = Yup.number().typeError(`${field.label} must be a number`);
                if (field.required) validator = validator.required(`${field.label} is required`);
            }
            if (field.type === 'email') {
                validator = Yup.string().email(`${field.label} must be a valid email`);
                if (field.required) validator = validator.required(`${field.label} is required`);
            }
            shape[field.name] = validator;
        });
        return Yup.object().shape(shape);
    };

    const formik = useFormik({
        initialValues: {},
        enableReinitialize: true,
        validationSchema: selectedTemplate
            ? buildValidationSchema(selectedTemplate.formSchema.fields)
            : Yup.object(),
        onSubmit: async (values) => {
            setSubmitting(true);
            try {
                await api.post('/requests', {
                    templateId: selectedTemplate._id,
                    formData: values,
                    status: 'submitted'
                });
                toast.success('Request submitted successfully!');
                navigate('/my-requests');
            } catch (err) {
                toast.error("Couldn't submit your request: " + (err.response?.data?.message || err.message));
                setDialog({
                    isOpen: true,
                    type: 'danger',
                    title: 'Submission Failed',
                    message: "We couldn't submit your request: " + (err.response?.data?.message || err.message)
                });
            } finally {
                setSubmitting(false);
            }
        }
    });

    useEffect(() => {
        if (selectedTemplate) {
            const initialVals = {};
            selectedTemplate.formSchema.fields.forEach(field => {
                initialVals[field.name] = cloneData?.[field.name] || '';
            });
            formik.setValues(initialVals);
        }
    }, [selectedTemplate, cloneData]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

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
                                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-primary/20 transition-colors">
                                    <FileText size={20} className="text-brand-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-text-primary group-hover:text-brand-primary mb-2">{t.title}</h3>
                                <p className="text-sm text-text-secondary">{t.description}</p>
                            </div>
                        ))}
                    </div>
                )}

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
                    {selectedTemplate.formSchema.fields.map((field) => {
                        const touched = formik.touched[field.name];
                        const error = formik.errors[field.name];
                        return (
                            <div key={field.name}>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    {field.label} {field.required && <span className="text-danger">*</span>}
                                </label>

                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        className={`input min-h-[100px] ${touched && error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values[field.name] || ''}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        name={field.name}
                                        className={`input ${touched && error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values[field.name] || ''}
                                    >
                                        <option value="">Select an option</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        className={`input ${touched && error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}`}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values[field.name] || ''}
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                )}

                                {touched && error && (
                                    <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
                                )}
                            </div>
                        );
                    })}

                    <div className="pt-6 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => setSelectedTemplate(null)} className="btn btn-ghost">Cancel</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
                            {submitting ? (
                                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                            ) : (
                                <><Send size={16} /> Submit Request</>
                            )}
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
