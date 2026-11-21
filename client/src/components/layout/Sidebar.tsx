import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  Receipt,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { SidebarInstallButton } from '../common/InstallAppPrompt';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();

  const navSections = [
    {
      label: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
    },
    {
      label: 'BILLING & CRM',
      items: [
        { name: 'Create Invoice', path: '/invoices/create', icon: FilePlus2 },
        { name: 'All Invoices', path: '/invoices', icon: Receipt },
        { name: 'Customers', path: '/customers', icon: Users },
        { name: 'Payments', path: '/payments', icon: CreditCard },
      ],
    },
    {
      label: 'INTELLIGENCE',
      items: [
        { name: 'Reports & GST', path: '/reports', icon: BarChart3 },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-300 ease-in-out md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="Cogniviz Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-slate-900 dark:text-white text-[12px] uppercase tracking-tight truncate">
                  {settings?.companyName || 'Cogniviz Technologies'}
                </span>
                <span className="text-[8.5px] font-bold text-blue-600 dark:text-blue-400 tracking-tight truncate">
                  "AI TO SIMPLIFY, TECH TO AMPLIFY"
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle for Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Direct Phone App Install Button */}
        <div className="px-3 pb-2">
          <SidebarInstallButton collapsed={collapsed} />
        </div>

        {/* Theme Quick Switcher Pill (In Sidebar) */}
        <div className="px-3 pb-2">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition-all border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 ${
              collapsed ? 'justify-center' : ''
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                {!collapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                {!collapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>
        </div>

        {/* Bottom: Admin Profile & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || 'admin@cogniviz.com'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
