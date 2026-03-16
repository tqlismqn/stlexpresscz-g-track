import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, FileText, Settings, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navigation = [
  { label: 'Панель', icon: LayoutDashboard, path: '/Dashboard', section: 'main' },
  { label: 'Водители', icon: Users, path: '/Drivers', section: 'main' },
  { label: 'Транспорт', icon: Truck, path: '#', disabled: true, badge: 'Soon', section: 'main' },
  { label: 'Документы', icon: FileText, path: '#', disabled: true, badge: 'Soon', section: 'main' },
  { label: 'Настройки', icon: Settings, path: '/Settings', section: 'settings' }
];

export default function Layout() {
  const location = useLocation();

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">G-Track TMS</h1>
          <p className="text-sm text-gray-400">STL Express</p>
        </div>

        <nav className="flex-1 p-6 space-y-1">
          {navigation.map((item, idx) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showSeparator = idx > 0 && navigation[idx].section !== navigation[idx - 1].section;

            return (
              <div key={item.path}>
                {showSeparator && <div className="my-4 border-t border-gray-700" />}
                {item.disabled ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded text-gray-500 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{item.badge}</span>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-6 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Выход</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}