import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Lock, Mail, User, Briefcase, Loader2, AlertCircle, CheckCircle2, XCircle, Zap, Shield, TrendingUp } from 'lucide-react';

const AuthPage = () => {
    const { login, signup, user } = useAuth();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        role: 'employee'
    });

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const checkPasswordStrength = (password) => {
        if (!password) return { score: 0, label: '', color: '' };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
        if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
        if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' };
        return { score, label: 'Strong', color: 'bg-emerald-500' };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'password' && !isLogin) {
            setPasswordStrength(checkPasswordStrength(value));
        }

        if (error) setError(null); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let result;
            if (isLogin) {
                result = await login(formData.email, formData.password);
            } else {
                if (formData.password !== formData.passwordConfirm) {
                    throw new Error("Passwords do not match");
                }
                result = await signup({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    passwordConfirm: formData.passwordConfirm,
                    role: formData.role
                });
            }

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setPasswordStrength({ score: 0, label: '', color: '' });
    };

    const features = [
        { icon: Zap, title: 'Lightning Fast', desc: 'Streamlined approval workflows' },
        { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security' },
        { icon: TrendingUp, title: 'Advanced Analytics', desc: 'Data-driven insights' }
    ];

    return (
        <div className="min-h-screen w-full flex bg-gradient-to-br from-[#f4f6f5] to-[#e8f0f1]">

            {}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1f6f78] to-[#16555c] flex-col justify-between p-16 relative overflow-hidden">
                {}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="z-10 space-y-12">
                    {}
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-lg">
                            <LayoutDashboard size={28} className="text-white" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight">OpsPilot</span>
                    </div>

                    {}
                    <div>
                        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Streamline Your<br />
                            <span className="text-[#cfe6e8]">Operations</span>
                        </h1>
                        <p className="text-white/80 text-lg max-w-md leading-relaxed">
                            Centralized platform for approvals, resource requests, and operational workflows. Built for modern teams.
                        </p>
                    </div>

                    {}
                    <div className="space-y-4">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                            >
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <feature.icon size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                                    <p className="text-white/70 text-xs mt-0.5">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {}
                <div className="z-10 text-sm text-white/60 font-medium">
                    &copy; 2025 OpsPilot <span className="mx-2">•</span> Enterprise Edition <span className="mx-2">•</span> v2.0
                </div>
            </div>

            {}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-[440px]">
                    {}
                    <div className="lg:hidden flex items-center gap-3 text-[#1f6f78] mb-8 justify-center">
                        <div className="w-10 h-10 bg-[#1f6f78]/10 rounded-lg flex items-center justify-center">
                            <LayoutDashboard size={24} />
                        </div>
                        <span className="font-bold text-2xl">OpsPilot</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-[#eef2f1] p-8 md:p-10 transition-all duration-300 hover:shadow-2xl">
                        {}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-[#1c2b2d] mb-2">
                                {isLogin ? 'Welcome back' : 'Get started'}
                            </h2>
                            <p className="text-[#6f8487] text-sm">
                                {isLogin
                                    ? 'Sign in to access your workspace'
                                    : 'Create your account to get started'}
                            </p>
                        </div>

                        {}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                                <div>
                                    <h4 className="text-red-800 font-semibold text-sm mb-1">
                                        {isLogin ? 'Sign in failed' : 'Registration failed'}
                                    </h4>
                                    <p className="text-red-700 text-xs">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-[#1c2b2d]">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 text-[#6f8487]" size={18} />
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                className="input pl-11 w-full"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-[#1c2b2d]">Role</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 text-[#6f8487]" size={18} />
                                            <select
                                                name="role"
                                                className="input pl-11 w-full"
                                                value={formData.role}
                                                onChange={handleChange}
                                            >
                                                <option value="employee">Employee</option>
                                                <option value="manager">Manager</option>
                                                <option value="admin">System Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[#1c2b2d]">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 text-[#6f8487]" size={18} />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        className="input pl-11 w-full"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[#1c2b2d]">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-[#6f8487]" size={18} />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        className="input pl-11 w-full"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {}
                                {!isLogin && formData.password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-[#6f8487]">Password strength</span>
                                            <span className={`font-semibold ${passwordStrength.label === 'Weak' ? 'text-red-600' :
                                                    passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                                                        passwordStrength.label === 'Good' ? 'text-blue-600' :
                                                            'text-emerald-600'
                                                }`}>{passwordStrength.label}</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-[#1c2b2d]">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 text-[#6f8487]" size={18} />
                                        <input
                                            name="passwordConfirm"
                                            type="password"
                                            required
                                            className="input pl-11 w-full"
                                            value={formData.passwordConfirm}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                        />
                                        {formData.passwordConfirm && (
                                            <div className="absolute right-3 top-3">
                                                {formData.password === formData.passwordConfirm ? (
                                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                                ) : (
                                                    <XCircle size={18} className="text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1f6f78] to-[#16555c] hover:from-[#16555c] hover:to-[#1f6f78] text-white font-semibold py-3 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-[#1f6f78] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create Account')}
                                </button>
                            </div>
                        </form>

                        {}
                        <div className="mt-8 pt-6 border-t border-[#eef2f1] text-center">
                            <p className="text-sm text-[#6f8487]">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button
                                    onClick={toggleMode}
                                    className="font-semibold text-[#1f6f78] hover:text-[#16555c] transition-colors focus:outline-none underline-offset-2 hover:underline"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
