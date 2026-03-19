import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, FileText, Settings, LogOut, Menu, ChevronDown, Bell, Building2, User, LogOut as LogOutIcon, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembership } from '@/lib/MembershipContext';
import { hasPermission } from '@/lib/permissions';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { permissions, companyId, companyName, allMemberships, hasMultipleCompanies, switchCompany, activeMembership } = useMembership();
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
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background flex items-center justify-between px-4 z-40 shrink-0">
        
        {/* LEFT: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-1 rounded-md hover:bg-accent transition-colors text-foreground"
            title={t('common.toggleSidebar')}
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg">{t('header.appName')}</span>
        </div>

        {/* CENTER: Company Switcher */}
        <div className="flex items-center">
          {hasMultipleCompanies ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors text-sm font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {companyName || t('settings.tabs.company')}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                <DropdownMenuLabel>{t('header.switchCompany')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allMemberships.map(membership => {
                  const memberCompanyName = membership.company_id === companyId ? companyName : membership.company_id;
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
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
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
            className="p-2 rounded-md hover:bg-accent transition-colors relative" 
            title={t('header.notifications')}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-md hover:bg-accent transition-colors">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {(currentUser?.display_name || currentUser?.email || '??').substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden md:block truncate">{currentUser?.display_name || currentUser?.email}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block flex-shrink-0" />
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