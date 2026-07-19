import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, Calendar, Settings, LogOut, Menu, X, Bell, Search, Layers } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('pm_admin_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('pm_admin_token');
    localStorage.removeItem('pm_admin_user');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'AI Knowledge', path: '/admin/knowledge', icon: BookOpen },
    { name: 'Events & Clubs', path: '/admin/events', icon: Calendar },
    { name: 'Notice Board', path: '/admin/notices', icon: Layers },
    { name: 'Committees', path: '/admin/committees', icon: Users },
    { name: 'Volunteers', path: '/admin/volunteers', icon: Users },
    { name: 'Seniors', path: '/admin/seniors', icon: Users },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-surface overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'}
        flex flex-col bg-surfaceVariant/20 border-r border-surfaceVariant/50
        transition-all duration-300 ease-in-out z-20 fixed md:relative h-full backdrop-blur-xl
      `}>
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surfaceVariant/50">
          <div className={`flex items-center gap-3 overflow-hidden ${!sidebarOpen && 'md:justify-center'}`}>
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-onPrimary font-bold shadow-sm flex-shrink-0">
              PM
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-onSurface whitespace-nowrap">PathMate OS</span>}
          </div>
          {sidebarOpen && (
            <button className="md:hidden text-onSurfaceVariant" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors group relative
                  ${isActive ? 'bg-primaryContainer text-onPrimaryContainer font-medium' : 'text-onSurfaceVariant hover:bg-surfaceVariant hover:text-onSurface'}
                  ${!sidebarOpen && 'md:justify-center px-0'}
                `}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'text-onSurfaceVariant group-hover:text-onSurface'} />
                {sidebarOpen && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile / Logout */}
        <div className="p-4 border-t border-surfaceVariant/50">
          <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} gap-3`}>
            {sidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-secondaryContainer text-onSecondaryContainer flex items-center justify-center font-bold uppercase flex-shrink-0">
                  {user.fullName ? user.fullName.charAt(0) : 'A'}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-onSurface truncate">{user.fullName || 'Admin'}</p>
                  <p className="text-xs text-onSurfaceVariant truncate">{user.role || 'Super Admin'}</p>
                </div>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className={`p-2 rounded-xl text-error hover:bg-errorContainer hover:text-onErrorContainer transition-colors ${!sidebarOpen && 'w-full flex justify-center'}`}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface relative">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface/80 backdrop-blur-md border-b border-surfaceVariant/30 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="text-onSurfaceVariant hover:bg-surfaceVariant p-2 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center bg-surfaceVariant/40 rounded-full px-4 py-2 border border-surfaceVariant/50">
              <Search size={18} className="text-onSurfaceVariant mr-2" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none focus:outline-none text-sm w-64 text-onSurface"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-onSurfaceVariant hover:bg-surfaceVariant rounded-xl transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-surfaceVariant/90 backdrop-blur-xl border border-surfaceVariant/50 rounded-2xl shadow-elevation3 overflow-hidden z-50">
                <div className="p-4 border-b border-surfaceVariant/50 flex justify-between items-center bg-surface">
                  <h3 className="font-bold text-onSurface">Notifications</h3>
                  <button className="text-primary text-xs font-semibold hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 border-b border-surfaceVariant/50 hover:bg-surfaceVariant/50 transition-colors cursor-pointer">
                    <p className="text-sm font-semibold text-onSurface">AI Assistant Model Updated</p>
                    <p className="text-xs text-onSurfaceVariant mt-1">System automatically switched to gemini-2.5-flash.</p>
                    <p className="text-[10px] text-onSurfaceVariant mt-2">Just now</p>
                  </div>
                  <div className="p-4 border-b border-surfaceVariant/50 hover:bg-surfaceVariant/50 transition-colors cursor-pointer">
                    <p className="text-sm font-semibold text-onSurface">New Student Registration</p>
                    <p className="text-xs text-onSurfaceVariant mt-1">12 new students enrolled in CSE.</p>
                    <p className="text-[10px] text-onSurfaceVariant mt-2">2 hours ago</p>
                  </div>
                  <div className="p-4 hover:bg-surfaceVariant/50 transition-colors cursor-pointer">
                    <p className="text-sm font-semibold text-onSurface">Document Re-indexed</p>
                    <p className="text-xs text-onSurfaceVariant mt-1">UG Regulations 2024 has finished processing.</p>
                    <p className="text-[10px] text-onSurfaceVariant mt-2">Yesterday</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 bg-surface">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default AdminLayout;
