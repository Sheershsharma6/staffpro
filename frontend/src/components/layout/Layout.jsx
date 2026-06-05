import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/candidates', icon: '👥', label: 'Candidates' },
  { path: '/recruitment', icon: '🎯', label: 'Recruitment' },
  { path: '/training', icon: '📚', label: 'Training' },
  { path: '/marketing', icon: '📣', label: 'Marketing' },
  { path: '/interviews', icon: '🗓', label: 'Interviews' },
  { path: '/placement', icon: '✅', label: 'Placement' },
  { path: '/payments', icon: '💳', label: 'Payments' },
  { path: '/reports', icon: '📊', label: 'Reports' },
];

const ADMIN_ITEMS = [
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  { path: '/admin/users', icon: '👤', label: 'Users' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-200 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">SP</div>
          {sidebarOpen && <span className="font-semibold text-lg">StaffPro</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <NavLink key={path} to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }>
              <span className="text-lg flex-shrink-0">{icon}</span>
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}

          {isAdmin() && (
            <>
              {sidebarOpen && <div className="px-3 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wider">Admin</div>}
              {ADMIN_ITEMS.map(({ path, icon, label }) => (
                <NavLink key={path} to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }>
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors">
            {sidebarOpen ? 'Sign out' : '←'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 transition-colors">
            ☰
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
