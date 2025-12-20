import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, Shield, Briefcase, User as UserIcon, Edit, UserX, UserCheck, Key, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editDialog, setEditDialog] = useState({ isOpen: false, user: null });
    const [passwordDialog, setPasswordDialog] = useState({ isOpen: false, user: null });
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', user: null });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.data.users);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditDialog({ isOpen: true, user: { ...user } });
    };

    const handleSaveEdit = async () => {
        try {
            await api.patch(`/users/${editDialog.user._id}`, {
                role: editDialog.user.role
            });
            await fetchUsers();
            setEditDialog({ isOpen: false, user: null });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user');
        }
    };

    const handleDeactivate = async (user) => {
        setConfirmDialog({ isOpen: true, type: 'deactivate', user });
    };

    const handleActivate = async (user) => {
        setConfirmDialog({ isOpen: true, type: 'activate', user });
    };

    const handleConfirmAction = async () => {
        try {
            if (confirmDialog.type === 'deactivate') {
                await api.patch(`/users/${confirmDialog.user._id}/deactivate`);
            } else if (confirmDialog.type === 'activate') {
                await api.patch(`/users/${confirmDialog.user._id}/activate`);
            }
            await fetchUsers();
            setConfirmDialog({ isOpen: false, type: '', user: null });
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleResetPassword = (user) => {
        setPasswordDialog({ isOpen: true, user, newPassword: '' });
    };

    const handleSavePassword = async () => {
        if (!passwordDialog.newPassword || passwordDialog.newPassword.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }

        try {
            await api.patch(`/users/${passwordDialog.user._id}/reset-password`, {
                newPassword: passwordDialog.newPassword
            });
            alert('Password reset successfully!');
            setPasswordDialog({ isOpen: false, user: null, newPassword: '' });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reset password');
        }
    };

    if (loading) return <div className="p-8">Loading users...</div>;

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-text-primary">User Directory</h1>
                <p className="text-text-secondary mt-1">Manage system access and roles</p>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-bg-subtle text-xs uppercase text-text-muted font-semibold">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>

                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light">
                        {users.map(u => (
                            <tr key={u._id} className="hover:bg-bg-subtle/30">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="font-medium text-text-primary">{u.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        u.role === 'manager' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                        {u.role === 'admin' && <Shield size={12} />}
                                        {u.role === 'manager' && <Briefcase size={12} />}
                                        {u.role === 'employee' && <UserIcon size={12} />}
                                        <span className="capitalize">{u.role}</span>
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-text-secondary font-mono text-xs">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${u.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {u.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEditUser(u)}
                                            className="p-1.5 hover:bg-brand-primary/10 rounded text-brand-primary"
                                            title="Edit User"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u)}
                                            className="p-1.5 hover:bg-purple-50 rounded text-purple-600"
                                            title="Reset Password"
                                        >
                                            <Key size={16} />
                                        </button>
                                        {u.isActive !== false ? (
                                            <button
                                                onClick={() => handleDeactivate(u)}
                                                className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                                title="Deactivate User"
                                            >
                                                <UserX size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(u)}
                                                className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600"
                                                title="Activate User"
                                            >
                                                <UserCheck size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            { }
            {editDialog.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">Edit User</h3>
                            <button onClick={() => setEditDialog({ isOpen: false, user: null })} className="text-text-muted hover:text-text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editDialog.user.name}
                                    disabled
                                    className="input bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                <select
                                    value={editDialog.user.role}
                                    onChange={(e) => setEditDialog({ ...editDialog, user: { ...editDialog.user, role: e.target.value } })}
                                    className="input"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditDialog({ isOpen: false, user: null })} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleSaveEdit} className="btn btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            { }
            {passwordDialog.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">Reset Password</h3>
                            <button onClick={() => setPasswordDialog({ isOpen: false, user: null })} className="text-text-muted hover:text-text-primary">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            Reset password for <strong>{passwordDialog.user.name}</strong>
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordDialog.newPassword}
                                    onChange={(e) => setPasswordDialog({ ...passwordDialog, newPassword: e.target.value })}
                                    className="input"
                                    placeholder="Minimum 8 characters"
                                />
                                <p className="text-xs text-text-muted mt-1">Password must be at least 8 characters long</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setPasswordDialog({ isOpen: false, user: null })} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleSavePassword} className="btn btn-primary bg-purple-600 hover:bg-purple-700">
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}

            { }
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, type: '', user: null })}
                onConfirm={handleConfirmAction}
                title={confirmDialog.type === 'deactivate' ? 'Deactivate User?' : 'Activate User?'}
                message={
                    confirmDialog.type === 'deactivate'
                        ? `Are you sure you want to deactivate ${confirmDialog.user?.name}? They will no longer be able to log in.`
                        : `Are you sure you want to activate ${confirmDialog.user?.name}? They will be able to log in again.`
                }
                type={confirmDialog.type === 'deactivate' ? 'danger' : 'success'}
                confirmText={confirmDialog.type === 'deactivate' ? 'Deactivate' : 'Activate'}
                cancelText="Cancel"
            />
        </div>
    );
};

export default AdminUsers;
