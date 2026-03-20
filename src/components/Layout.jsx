import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, FileText, Settings, LogOut, Menu, ChevronDown, Bell, Building2, User, LogOut as LogOutIcon, Check, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembership } from '@/lib/MembershipContext';
import { hasPermission } from '@/lib/permissions';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { permissions, companyId, companyName, allMemberships, hasMultipleCompanies, switchCompany, activeMembership, companiesMap } = useMembership();
  const { t, i18n } = useTranslation();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const hasRestoredLang = useRef(false);

  // Graceful fallback: if permissions haven't loaded, show all items
  const canView = (permId) => !permissions.length || hasPermission(permissions, permId);

  if (currentUser?.language && !hasRestoredLang.current) {
    if (i18n.language !== currentUser.language) {
      i18n.changeLanguage(currentUser.language);
    }
    hasRestoredLang.current = true;
  }

  const navigation = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/Dashboard', section: 'main', permission: 'dashboard_view' },
    { label: t('nav.drivers'), icon: Users, path: '/Drivers', section: 'main', permission: 'drivers_view' },
    { label: t('nav.vehicles'), icon: Truck, path: '#', disabled: true, badge: t('common.soon'), section: 'main' },
    { label: t('nav.documents'), icon: FileText, path: '#', disabled: true, badge: t('common.soon'), section: 'main', permission: 'doc_view' },
    { label: t('nav.settings'), icon: Settings, path: '/Settings', section: 'settings' }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-white/10 bg-slate-900 text-white flex items-center justify-between px-4 z-40 shrink-0">
        
        {/* LEFT: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-1 rounded-md hover:bg-white/10 transition-colors text-white"
            title={t('common.toggleSidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 30 30" className="shrink-0">
            <path fill="#ea580c" d="M 15.070312 11.535156 L 15.070312 16.925781 C 15.070312 17.058594 15.179688 17.167969 15.316406 17.167969 L 22.515625 17.167969 C 22.691406 17.167969 22.8125 17.347656 22.742188 17.511719 C 21.53125 20.335938 18.804688 22.359375 15.589844 22.558594 C 10.628906 22.863281 6.46875 18.738281 6.738281 13.773438 C 6.976562 9.382812 10.621094 5.886719 15.070312 5.886719 C 17.484375 5.886719 19.761719 6.921875 21.347656 8.734375 C 21.4375 8.832031 21.585938 8.847656 21.6875 8.761719 L 25.84375 5.324219 C 25.949219 5.238281 25.960938 5.082031 25.871094 4.976562 C 23.160156 1.816406 19.238281 0.0078125 15.070312 0.0078125 C 11.269531 0.0078125 7.699219 1.484375 5.011719 4.171875 C 2.328125 6.859375 0.847656 10.429688 0.847656 14.230469 C 0.847656 16.707031 1.476562 19.089844 2.660156 21.191406 C 2.691406 21.246094 2.703125 21.3125 2.683594 21.375 L 0.75 28.675781 C 0.703125 28.859375 0.875 29.027344 1.058594 28.972656 L 8.242188 26.796875 C 8.304688 26.777344 8.371094 26.785156 8.429688 26.8125 C 10.449219 27.882812 12.714844 28.453125 15.070312 28.453125 C 18.871094 28.453125 22.441406 26.972656 25.128906 24.285156 C 27.8125 21.601562 29.292969 18.027344 29.292969 14.230469 L 29.292969 11.535156 C 29.292969 11.398438 29.183594 11.289062 29.046875 11.289062 L 15.316406 11.289062 C 15.179688 11.289062 15.070312 11.398438 15.070312 11.535156" fillRule="nonzero"/>
          </svg>
          <span className="font-semibold text-sm text-white">{t('header.appName')}</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500 text-white rounded-full">Beta</span>
        </div>

        {/* CENTER: Company Switcher */}
        <div className="flex items-center">
          {hasMultipleCompanies ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-sm font-medium text-white">
                  <Building2 className="h-4 w-4 text-white/60" />
                  {companyName || t('settings.tabs.company')}
                  <ChevronDown className="h-3 w-3 text-white/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                <DropdownMenuLabel>{t('header.switchCompany')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allMemberships.map(membership => {
                  const memberCompanyName = companiesMap[membership.company_id]?.name || t('common.loading');
                  return (
                    <DropdownMenuItem
                      key={membership.id}
                      onClick={() => switchCompany(membership.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <span>{memberCompanyName}</span>
                      {membership.id === activeMembership?.id && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Building2 className="h-4 w-4 text-white/60" />
              {companyName || t('common.loading')}
            </div>
          )}
        </div>

        {/* RIGHT: Language + Notifications + Avatar */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications Bell */}
          <button 
            className="p-2 rounded-md hover:bg-white/10 transition-colors relative" 
            title={t('header.notifications')}
          >
            <Bell className="h-4 w-4 text-white/70" />
          </button>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-md hover:bg-white/10 transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {(currentUser?.display_name || currentUser?.email || '??').substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white hidden md:block truncate">{currentUser?.display_name || currentUser?.email}</span>
                <ChevronDown className="h-3 w-3 text-white/60 hidden md:block flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{currentUser?.display_name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings?tab=profile')}>
                <User className="h-4 w-4 mr-2" />
                {t('settings.tabs.profile')}
              </DropdownMenuItem>
              {hasPermission(permissions, 'settings_company') && (
                <DropdownMenuItem onClick={() => navigate('/settings?tab=company')}>
                  <Building2 className="h-4 w-4 mr-2" />
                  {t('settings.tabs.company')}
                </DropdownMenuItem>
              )}
              {hasPermission(permissions, 'settings_team') && (
                <DropdownMenuItem onClick={() => navigate('/settings?tab=team')}>
                  <Users className="h-4 w-4 mr-2" />
                  {t('settings.tabs.team')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOutIcon className="h-4 w-4 mr-2" />
                {t('header.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </header>

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
              // Gate by permission if specified (Settings always visible)
              if (item.permission && !canView(item.permission)) return null;

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
              title={sidebarExpanded ? '' : t('common.logout')}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarExpanded && <span className="truncate">{t('common.logout')}</span>}
              {!sidebarExpanded && (
                <div className="absolute left-20 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                  {t('common.logout')}
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