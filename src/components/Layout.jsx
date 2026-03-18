import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, FileText, Settings, LogOut, Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const navigation = [
  { label: 'Дашборд', icon: LayoutDashboard, path: '/Dashboard', section: 'main' },
  { label: 'Водители', icon: Users, path: '/Drivers', section: 'main' },
  { label: 'Транспорт', icon: Truck, path: '#', disabled: true, badge: 'Soon', section: 'main' },
  { label: 'Документы', icon: FileText, path: '#', disabled: true, badge: 'Soon', section: 'main' },
  { label: 'Настройки', icon: Settings, path: '/Settings', section: 'settings' }
];

export default function Layout() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center px-6 z-40">
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="text-gray-300 hover:text-white mr-4"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">G-Track TMS</h1>
          <p className="text-xs text-gray-400">STL Express</p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">{currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'U'}</span>
          </div>
          <span className="text-sm text-gray-300">{currentUser?.full_name || 'User'}</span>
        </div>
      </div>

      <div className="flex flex-1 pt-14">
        {/* Sidebar */}
        <div
          className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col transition-all duration-200 overflow-y-auto z-30 ${
            sidebarExpanded ? 'w-60' : 'w-16'
          }`}
        >
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigation.map((item, idx) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showSeparator = idx > 0 && navigation[idx].section !== navigation[idx - 1].section;

              return (
                <div key={item.path}>
                  {showSeparator && sidebarExpanded && <div className="my-3 border-t border-gray-700" />}
                  {item.disabled ? (
                    <div
                      className="flex items-center justify-center gap-3 px-3 py-3 rounded text-gray-500 cursor-not-allowed group"
                      title={sidebarExpanded ? '' : item.label}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarExpanded && (
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate">{item.label}</span>
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                            {item.badge}
                          </span>
                        </div>
                      )}
                      {!sidebarExpanded && (
                        <div className="absolute left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-3 rounded transition-colors relative group ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                      title={sidebarExpanded ? '' : item.label}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarExpanded && <span className="truncate">{item.label}</span>}
                      {!sidebarExpanded && (
                        <div className="absolute left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded text-gray-300 hover:bg-gray-800 transition-colors w-full group relative"
              title={sidebarExpanded ? '' : 'Выход'}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarExpanded && <span className="truncate">Выход</span>}
              {!sidebarExpanded && (
                <div className="absolute left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                  Выход
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-hidden transition-all duration-200 ${sidebarExpanded ? 'ml-60' : 'ml-16'}`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}