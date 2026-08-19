import React, { useState, useRef, useEffect } from 'react';
import { useStudio, ActiveTab } from '../../context/StudioContext';
import { EmployeeRole } from '../../types';
import {
  Camera,
  Moon,
  Sun,
  Plus,
  Receipt,
  CreditCard,
  Layers,
  Users,
  TrendingUp,
  Settings,
  LayoutDashboard,
  Sparkles,
  Shield,
  Palette,
  Tag,
  Frame,
  Printer,
  Gift,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  Bell,
} from 'lucide-react';

interface NavbarProps {
  onOpenCounterBooking: () => void;
  onOpenNewInvoice: () => void;
  onOpenRecordPayment: () => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCounterBooking,
  onOpenNewInvoice,
  onOpenRecordPayment,
  onOpenNotifications,
}) => {
  const {
    profile,
    darkMode,
    setDarkMode,
    activeTab,
    setActiveTab,
    currentRole,
    setCurrentRole,
    orders,
  } = useStudio();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMastersDropdownOpen, setIsMastersDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMastersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingEditingCount = orders.filter(
    (o) => o.status === 'editing_pending' || o.status === 'editing_in_progress' || o.status === 'new_order' || o.status === 'photos_selected'
  ).length;
  const readyCount = orders.filter((o) => o.status === 'ready_for_delivery').length;
  const unpaidCount = orders.filter((o) => (o.payment.balanceDue || 0) > 0).length;

  const isMasterTabActive =
    activeTab === 'price_master' || activeTab === 'frame_master' || activeTab === 'print_master';

  const handleNavClick = (tabId: ActiveTab) => {
    setIsMobileMenuOpen(false);
    setIsMastersDropdownOpen(false);
    if (tabId === 'counter_pos') {
      onOpenCounterBooking();
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Left: Brand & Studio Logo */}
            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white dark:bg-slate-800 p-0.5 border border-amber-500/40 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 overflow-hidden">
                <img
                  src="/sapna_logo.png"
                  alt="Sapna Photo Studio"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {profile.name}
                </span>
                <span className="hidden xl:inline-block text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  Mansa
                </span>
              </div>
            </div>

            {/* Desktop Nav Items (Clean, No Line Breaks, Masters Dropdown) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {/* Dashboard */}
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Dashboard</span>
              </button>

              {/* Orders Workflow */}
              <button
                onClick={() => handleNavClick('orders_workflow')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'orders_workflow'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Orders</span>
                {pendingEditingCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500 text-white">
                    {pendingEditingCount}
                  </span>
                )}
              </button>

              {/* Ready Orders */}
              <button
                onClick={() => handleNavClick('ready_orders')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'ready_orders'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Gift className="w-3.5 h-3.5 shrink-0" />
                <span>Ready</span>
                {readyCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500 text-white">
                    {readyCount}
                  </span>
                )}
              </button>

              {/* Pending Payments */}
              <button
                onClick={() => handleNavClick('pending_payments')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'pending_payments'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Pending</span>
                {unpaidCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white">
                    {unpaidCount}
                  </span>
                )}
              </button>

              {/* Masters Dropdown (Price, Frame, Print) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsMastersDropdownOpen(!isMastersDropdownOpen)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    isMasterTabActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span>Masters</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMastersDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMastersDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => handleNavClick('price_master')}
                      className={`w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        activeTab === 'price_master' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="block font-bold">Price Master</span>
                        <span className="text-[10px] text-slate-400 font-normal">Passport, Visa & Modeling</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavClick('frame_master')}
                      className={`w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        activeTab === 'frame_master' ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Frame className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <span className="block font-bold">Frame Master</span>
                        <span className="text-[10px] text-slate-400 font-normal">Vel & Royal Frame Matrix</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleNavClick('print_master')}
                      className={`w-full flex items-center space-x-2 px-3.5 py-2 text-xs font-bold text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        activeTab === 'print_master' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Printer className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span className="block font-bold">Print Master</span>
                        <span className="text-[10px] text-slate-400 font-normal">Mobile & Large Prints</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Invoices */}
              <button
                onClick={() => handleNavClick('billing')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'billing'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span>Invoices</span>
              </button>

              {/* Customers */}
              <button
                onClick={() => handleNavClick('customers')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Customers</span>
              </button>

              {/* Reports */}
              <button
                onClick={() => handleNavClick('reports')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>Reports</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleNavClick('settings')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span>Settings</span>
              </button>
            </nav>

            {/* Right: Role Switcher & Action Buttons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Employee Role Selector */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <Shield className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as EmployeeRole)}
                  className="bg-transparent text-xs font-bold text-slate-900 dark:text-white capitalize focus:outline-hidden cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="counter">Counter</option>
                  <option value="photographer">Photographer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>

              {/* Fast Counter Booking Button */}
              <button
                onClick={onOpenCounterBooking}
                className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black px-3 py-1.5 sm:py-2 rounded-xl shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Order</span>
              </button>

              {/* Notification Reminders Bell Button */}
              <button
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Studio Reminders & Pending Work Alerts"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                {pendingEditingCount + readyCount + unpaidCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse shadow-sm">
                    {pendingEditingCount + readyCount + unpaidCount}
                  </span>
                )}
              </button>

              {/* Dark / Light Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile Hamburger Drawer Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile / Tablet Horizontal Quick Scroll Tabs */}
          <div className="flex lg:hidden overflow-x-auto py-2 space-x-1.5 border-t border-slate-100 dark:border-slate-800/80 no-scrollbar text-xs">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders_workflow', label: 'Orders', icon: Layers, badge: pendingEditingCount > 0 ? pendingEditingCount : undefined },
              { id: 'ready_orders', label: 'Ready', icon: Gift, badge: readyCount > 0 ? readyCount : undefined },
              { id: 'pending_payments', label: 'Pending', icon: CreditCard, badge: unpaidCount > 0 ? unpaidCount : undefined },
              { id: 'price_master', label: 'Price Master', icon: Tag },
              { id: 'frame_master', label: 'Frame Master', icon: Frame },
              { id: 'print_master', label: 'Print Master', icon: Printer },
              { id: 'billing', label: 'Invoices', icon: Receipt },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'reports', label: 'Reports', icon: TrendingUp },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as ActiveTab)}
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl whitespace-nowrap font-bold transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1 rounded-full bg-amber-500 text-slate-950 font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl p-5 flex flex-col justify-between overflow-y-auto border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200 text-left">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {profile.name}
                    </h3>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      Studio Management &bull; Mansa
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Role Switcher on Mobile */}
              <div className="my-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                  Active Staff Role
                </label>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value as EmployeeRole)}
                  className="w-full bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="admin">👑 Admin</option>
                  <option value="counter">💼 Counter Staff</option>
                  <option value="photographer">📷 Photographer</option>
                  <option value="editor">🎨 Editor / Lab</option>
                </select>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1">
                  Core Workflow
                </span>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'orders_workflow', label: 'Orders Workflow', icon: Layers, badge: pendingEditingCount > 0 ? pendingEditingCount : undefined, badgeColor: 'bg-indigo-500 text-white' },
                  { id: 'ready_orders', label: 'Ready Orders', icon: Gift, badge: readyCount > 0 ? readyCount : undefined, badgeColor: 'bg-emerald-500 text-white' },
                  { id: 'pending_payments', label: 'Pending Balance', icon: CreditCard, badge: unpaidCount > 0 ? unpaidCount : undefined, badgeColor: 'bg-rose-500 text-white' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id as ActiveTab)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-slate-950 text-white' : item.badgeColor || 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mt-3 mb-1">
                  Admin Masters
                </span>
                {[
                  { id: 'price_master', label: 'Price Master (Packages)', icon: Tag },
                  { id: 'frame_master', label: 'Frame Master (Vel / Royal)', icon: Frame },
                  { id: 'print_master', label: 'Print-Only Master', icon: Printer },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id as ActiveTab)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mt-3 mb-1">
                  Operations & Settings
                </span>
                {[
                  { id: 'billing', label: 'Invoices & Billing', icon: Receipt },
                  { id: 'customers', label: 'Customer CRM', icon: Users },
                  { id: 'reports', label: 'Financial Reports', icon: TrendingUp },
                  { id: 'settings', label: 'Settings & Backup', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id as ActiveTab)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCounterBooking();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Counter Booking</span>
              </button>
              <p className="text-[10px] text-center text-slate-400">
                Sapna Photoshop &bull; Mansa, Gandhinagar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
