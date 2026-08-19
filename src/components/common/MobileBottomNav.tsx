import React from 'react';
import { useStudio, ActiveTab } from '../../context/StudioContext';
import {
  LayoutDashboard,
  Layers,
  Plus,
  Gift,
  CreditCard,
  Receipt,
  Users,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenCounterBooking: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenCounterBooking,
}) => {
  const { activeTab, setActiveTab, orders } = useStudio();

  const pendingEditingCount = orders.filter(
    (o) =>
      o.status === 'editing_pending' ||
      o.status === 'editing_in_progress' ||
      o.status === 'new_order'
  ).length;

  const readyCount = orders.filter((o) => o.status === 'ready_for_delivery').length;
  const unpaidCount = orders.filter((o) => (o.payment.balanceDue || 0) > 0).length;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-3 py-2 shadow-2xl safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-amber-500 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Home</span>
        </button>

        {/* 2. Orders Workflow */}
        <button
          onClick={() => setActiveTab('orders_workflow')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'orders_workflow'
              ? 'text-amber-500 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Orders</span>
          {pendingEditingCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {pendingEditingCount}
            </span>
          )}
        </button>

        {/* 3. Elevated Center Booking Action Button */}
        <button
          onClick={onOpenCounterBooking}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group active:scale-95 transition"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 ring-4 ring-white dark:ring-slate-900 group-hover:scale-105 transition">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] mt-1 font-extrabold text-amber-600 dark:text-amber-400">
            + Book
          </span>
        </button>

        {/* 4. Ready Orders */}
        <button
          onClick={() => setActiveTab('ready_orders')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'ready_orders'
              ? 'text-emerald-500 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Ready</span>
          {readyCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {readyCount}
            </span>
          )}
        </button>

        {/* 5. Pending Payments / Dues */}
        <button
          onClick={() => setActiveTab('pending_payments')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition cursor-pointer ${
            activeTab === 'pending_payments'
              ? 'text-rose-500 font-extrabold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">Dues</span>
          {unpaidCount > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
              {unpaidCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
