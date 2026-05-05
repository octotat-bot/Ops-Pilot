import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User, Mail, Briefcase, Shield, Calendar, Award,
    CheckCircle2, Activity, Edit2,
    Save, X, Camera, MapPin, Phone, Globe, Loader2
} from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const Profile = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState({ requests: 0, approvals: 0, pending: 0 });
    // Persist phone/location in localStorage since backend doesn't have these fields yet
    const [editData, setEditData] = useState({
        name: user?.name || '',
        department: user?.department || '',
        phone: localStorage.getItem(`profile_phone_${user?._id}`) || '',
        location: localStorage.getItem(`profile_location_${user?._id}`) || ''
    });

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        setStatsLoading(true);
        try {
            // Fixed: was /requests/my-requests (404) → correct endpoint is /requests/me
            const [requestsRes, approvalsRes] = await Promise.all([
                api.get('/requests/me'),
                api.get('/requests/approvals')
            ]);

            const requests = requestsRes.data.data.requests || [];
            const approvals = approvalsRes.data.data.approvals || [];

            setStats({
                requests: requests.length,
                approvals: approvals.length,
                pending: requests.filter(r => r.status === 'pending').length
            });
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save phone/location to localStorage (these are local-only fields)
            if (user?._id) {
                localStorage.setItem(`profile_phone_${user._id}`, editData.phone);
                localStorage.setItem(`profile_location_${user._id}`, editData.location);
            }
            // Save name/department to backend
            await api.patch(`/users/${user._id}`, {
                name: editData.name,
                department: editData.department
            });
            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const joinDate = new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const getRoleBadge = (role) => {
        const configs = {
            admin: { color: 'from-purple-500 to-purple-600', icon: Shield, label: 'Administrator' },
            manager: { color: 'from-blue-500 to-blue-600', icon: Briefcase, label: 'Manager' },
            employee: { color: 'from-emerald-500 to-emerald-600', icon: User, label: 'Employee' }
        };
        return configs[role] || configs.employee;
    };

    const roleBadge = getRoleBadge(user?.role);
    const RoleIcon = roleBadge.icon;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            { }
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
                    <p className="text-text-secondary mt-1">Manage your account settings and preferences</p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Edit2 size={16} />
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <X size={16} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                { }
                <div className="lg:col-span-1">
                    <div className="card p-0 overflow-hidden">
                        { }
                        <div className="relative h-32 bg-gradient-to-br from-brand-primary to-[#16555c]">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-4 right-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                            </div>
                        </div>

                        { }
                        <div className="relative px-6 pb-6">
                            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-white to-gray-50 p-1 shadow-xl">
                                        <div className={`w-full h-full rounded-xl bg-gradient-to-br ${roleBadge.color} text-white flex items-center justify-center text-5xl font-bold`}>
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <button className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all">
                                            <Camera size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="pt-20 text-center">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                        className="input text-center text-xl font-bold mb-2"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-text-primary mb-2">{user?.name}</h2>
                                )}

                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${roleBadge.color} text-white text-sm font-semibold shadow-lg mb-4`}>
                                    <RoleIcon size={16} />
                                    {roleBadge.label}
                                </div>

                                <p className="text-text-secondary text-sm mb-6">{user?.email}</p>

                                { }
                                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border-light">
                                    {statsLoading ? (
                                        [1,2,3].map(i => (
                                            <div key={i} className="text-center animate-pulse">
                                                <div className="h-7 bg-gray-200 rounded w-10 mx-auto mb-1"></div>
                                                <div className="h-3 bg-gray-100 rounded w-14 mx-auto"></div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-brand-primary">{stats.requests}</div>
                                                <div className="text-xs text-text-muted mt-1">Requests</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-emerald-600">{stats.approvals}</div>
                                                <div className="text-xs text-text-muted mt-1">Approvals</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                                <div className="text-xs text-text-muted mt-1">Pending</div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="card mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="text-yellow-500" size={20} />
                            <h3 className="font-semibold text-text-primary">Achievements</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
                                    🏆
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-text-primary">Early Adopter</div>
                                    <div className="text-xs text-text-muted">Joined OpsPilot</div>
                                </div>
                            </div>
                            {stats.requests >= 10 && (
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white">
                                        ⭐
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-text-primary">Active User</div>
                                        <div className="text-xs text-text-muted">10+ requests submitted</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                { }
                <div className="lg:col-span-2 space-y-6">
                    { }
                    <div className="card">
                        <div className="flex items-center gap-2 mb-6">
                            <User className="text-brand-primary" size={20} />
                            <h3 className="text-lg font-semibold text-text-primary">Personal Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    <Mail size={14} className="inline mr-2" />
                                    Email Address
                                </label>
                                <div className="input bg-bg-subtle cursor-not-allowed">
                                    {user?.email}
                                </div>
                                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    <Phone size={14} className="inline mr-2" />
                                    Phone Number
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="input"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                ) : (
                                    <div className="input bg-bg-subtle">
                                        {editData.phone || 'Not specified'}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    <MapPin size={14} className="inline mr-2" />
                                    Location
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.location}
                                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                        className="input"
                                        placeholder="e.g., New York, USA"
                                    />
                                ) : (
                                    <div className="input bg-bg-subtle">
                                        {editData.location || 'Not specified'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    { }
                    <div className="card">
                        <div className="flex items-center gap-2 mb-6">
                            <Shield className="text-brand-primary" size={20} />
                            <h3 className="text-lg font-semibold text-text-primary">Account Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-bg-subtle rounded-lg border border-border-light">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                                        <Shield size={18} className="text-brand-primary" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted">User ID</div>
                                        <div className="text-sm font-mono font-semibold text-text-primary">
                                            {user?._id?.slice(-8) || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-bg-subtle rounded-lg border border-border-light">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <Calendar size={18} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted">Member Since</div>
                                        <div className="text-sm font-semibold text-text-primary">
                                            {joinDate}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-bg-subtle rounded-lg border border-border-light">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <Activity size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted">Account Status</div>
                                        <div className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 size={14} />
                                            {user?.status || 'Active'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-bg-subtle rounded-lg border border-border-light">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <Globe size={18} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-text-muted">Access Level</div>
                                        <div className="text-sm font-semibold text-text-primary capitalize">
                                            {user?.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    { }
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Shield className="text-white" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                                        Privileged Account
                                        <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs rounded-full font-semibold">
                                            {user?.role?.toUpperCase()}
                                        </span>
                                    </h4>
                                    <p className="text-sm text-orange-800/90 leading-relaxed">
                                        You have elevated permissions to {user?.role === 'admin' ? 'manage templates, users, and view all system data' : 'approve requests and delegate responsibilities'}.
                                        Please adhere to the internal data policy and security guidelines.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
