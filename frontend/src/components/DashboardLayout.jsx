import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    CheckSquare,
    BarChart2,
    Settings,
    PlusCircle,
    LogOut,
    Globe,
    Users,
    TrendingUp,
    Menu,
    X
} from 'lucide-react';
import clsx from 'clsx';
import NotificationCenter from './NotificationCenter';
import SearchBar from './SearchBar';

const SidebarItem = ({ to, icon: Icon, children, onClick }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 text-sm transition-all mb-1 border-l-4",
                isActive
                    ? "border-brand-primary bg-[#dceeee] text-brand-primary font-semibold"
                    : "border-transparent text-text-secondary hover:bg-[#e6ebea] hover:text-text-primary"
            )}
        >
            {({ isActive }) => (
                <>
                    <Icon size={18} className={isActive ? "text-brand-primary" : "text-text-muted"} />
                    <span>{children}</span>
                </>
            )}
        </NavLink>
    );
};

const SidebarContent = ({ user, navigate, logout, onLinkClick }) => (
    <>
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[#d9e1e0] bg-[#eef2f1] flex-shrink-0">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-lg tracking-tight">
                <LayoutDashboard size={20} />
                <span>OpsPilot</span>
            </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="px-4 mb-6">
                {user?.role === 'admin' ? (
                    <button
                        onClick={() => { navigate('/templates?create=true'); onLinkClick?.(); }}
                        className="w-full bg-brand-primary hover:bg-[#16555c] text-white shadow-sm hover:shadow-md transition-all rounded-md py-2.5 px-4 flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        <PlusCircle size={16} />
                        <span>New Template</span>
                    </button>
                ) : (
                    <NavLink
                        to="/requests/new"
                        onClick={onLinkClick}
                        className="w-full bg-brand-primary hover:bg-[#16555c] text-white shadow-sm hover:shadow-md transition-all rounded-md py-2.5 px-4 flex items-center justify-center gap-2 font-medium text-sm"
                    >
                        <PlusCircle size={16} />
                        <span>New Request</span>
                    </NavLink>
                )}
            </div>

            <div className="mb-2">
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 px-5">Menu</p>
                <SidebarItem to="/dashboard" icon={LayoutDashboard} onClick={onLinkClick}>Dashboard</SidebarItem>
                {/* Employees and managers can see their own requests */}
                {user?.role !== 'admin' && (
                    <SidebarItem to="/my-requests" icon={FileText} onClick={onLinkClick}>My Requests</SidebarItem>
                )}
                {/* Only managers and admins have requests to approve */}
                {(user?.role === 'manager' || user?.role === 'admin') && (
                    <SidebarItem to="/approvals" icon={CheckSquare} onClick={onLinkClick}>Approvals</SidebarItem>
                )}
            </div>

            <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2 px-5 mt-6">Management</p>
                <SidebarItem to="/analytics" icon={BarChart2} onClick={onLinkClick}>Analytics</SidebarItem>
                <SidebarItem to="/advanced-analytics" icon={TrendingUp} onClick={onLinkClick}>Advanced Analytics</SidebarItem>
                {user?.role === 'manager' && (
                    <SidebarItem to="/delegations" icon={Users} onClick={onLinkClick}>Delegations</SidebarItem>
                )}
                {user?.role === 'admin' && (
                    <>
                        <SidebarItem to="/global-requests" icon={Globe} onClick={onLinkClick}>Global Requests</SidebarItem>
                        <SidebarItem to="/users" icon={Users} onClick={onLinkClick}>User Directory</SidebarItem>
                        <SidebarItem to="/templates" icon={Settings} onClick={onLinkClick}>Templates</SidebarItem>
                    </>
                )}
            </div>
        </div>

        {/* User footer */}
        <div className="border-t border-[#d9e1e0] bg-white flex-shrink-0">
            <div className="flex items-center gap-3 p-4">
                <div
                    className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer group hover:bg-gray-50 rounded-lg -ml-2 p-2 transition-colors"
                    onClick={() => { navigate('/profile'); onLinkClick?.(); }}
                    role="button"
                    tabIndex={0}
                >
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0 group-hover:bg-brand-primary/20 transition-colors">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1c2b2d] truncate group-hover:text-brand-primary transition-colors" title={user?.name}>
                            {user?.name}
                        </p>
                        <p className="text-xs text-[#6f8487] truncate" title={user?.email}>
                            {user?.email || user?.role}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="text-[#6f8487] hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    </>
);

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const closeSidebar = () => setMobileSidebarOpen(false);

    return (
        <div className="flex h-screen w-full bg-[#f4f6f5] overflow-hidden font-sans">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 bg-[#eef2f1] border-r border-[#d9e1e0] flex-col h-full flex-shrink-0 relative z-20">
                <SidebarContent user={user} navigate={navigate} logout={logout} />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeSidebar}
                    />
                    {/* Drawer */}
                    <aside className="relative w-72 bg-[#eef2f1] border-r border-[#d9e1e0] flex flex-col h-full z-50 animate-slide-in-left">
                        {/* Close button */}
                        <button
                            onClick={closeSidebar}
                            className="absolute top-4 right-4 p-1.5 text-text-muted hover:text-text-primary hover:bg-[#d9e1e0] rounded-lg transition-colors z-10"
                        >
                            <X size={18} />
                        </button>
                        <SidebarContent user={user} navigate={navigate} logout={logout} onLinkClick={closeSidebar} />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f6f5] h-full">
                {/* Header */}
                <header className="h-14 bg-white border-b border-[#d9e1e0] flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10 shadow-sm gap-3">
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="md:hidden p-2 text-text-muted hover:text-text-primary hover:bg-[#f4f6f5] rounded-lg transition-colors flex-shrink-0"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex-1">
                        <SearchBar />
                    </div>

                    <div className="flex items-center gap-3 border-l border-[#d9e1e0] pl-4 h-8 flex-shrink-0">
                        <NotificationCenter />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-slick">
                    <div className="w-full mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
