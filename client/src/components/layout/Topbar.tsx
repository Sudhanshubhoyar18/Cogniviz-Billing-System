import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Menu,
  Users,
  Calendar,
  Sun,
  Moon,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/invoices?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-colors duration-150">
      {/* Left: Mobile Menu + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice number, client, GSTIN... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400 dark:text-slate-400 font-mono">
              ⌘K
            </kbd>
          )}
        </form>
      </div>

      {/* Right: Quick Actions, Theme Toggle & Status */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Financial Year Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>FY {settings?.financialYear || '2026-27'}</span>
        </div>

        {/* GST Compliance Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>GST Active</span>
        </div>

        {/* Dark/Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all shadow-sm"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-90 duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 transition-transform rotate-0 hover:-rotate-12 duration-300" />
          )}
        </button>

        {/* Quick Add Client */}
        <button
          onClick={() => navigate('/customers?action=new')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
        >
          <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>+ Customer</span>
        </button>

        {/* Primary Action Button: Create Invoice */}
        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Invoice</span>
          <span className="sm:hidden">Invoice</span>
        </button>
      </div>
    </header>
  );
};
