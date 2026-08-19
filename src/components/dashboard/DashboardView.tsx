import React from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Camera,
  Users,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  ArrowRight,
  PackageCheck,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenCounterBooking: () => void;
  onOpenNewInvoice: () => void;
  onOpenRecordPayment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCounterBooking,
  onOpenRecordPayment,
}) => {
  const {
    orders,
    customers,
    getDailyStats,
    formatCurrency,
    setActiveTab,
    profile,
  } = useStudio();

  const stats = getDailyStats();

  // Active / Urgent Alerts
  const pendingEditingOrders = orders.filter(
    (o) => o.status === 'editing_pending' || o.status === 'editing_in_progress'
  );
  const readyOrders = orders.filter((o) => o.status === 'ready_for_delivery');
  const unpaidOrders = orders.filter((o) => o.payment.balanceDue > 0);

  // Split payment stats for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt === todayStr);
  const todaySplitOrders = todayOrders.filter((o) => o.payment.mode === 'split');
  const totalSplitRevenue = todaySplitOrders.reduce((sum, o) => sum + o.payment.advancePaid, 0);

  const sendWhatsAppReminder = (order: typeof orders[0]) => {
    const text = `*Payment Reminder from ${profile.name}*\n\nHello ${order.clientName}!\nThis is a friendly reminder for order *#${order.orderNumber}* (${order.serviceTitle}):\n• Total Bill: ${formatCurrency(order.pricing.finalTotal)}\n• *Pending Balance: ${formatCurrency(order.payment.balanceDue)}*\n\nUPI ID: ${profile.upiId}\nBank: ${profile.bankName} (A/C: ${profile.accountNumber}, IFSC: ${profile.ifscCode})\n\nThank you!`;
    const cleanPhone = order.mobileNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getSourceIcon = (order: typeof orders[0]) => {
    if (order.photoSource === 'whatsapp' || (order.photoNumber && order.photoNumber.startsWith('WA_'))) {
      return { icon: '📱', label: 'WhatsApp', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    }
    if (order.photoSource === 'scan' || (order.photoNumber && order.photoNumber.startsWith('SCAN_'))) {
      return { icon: '🖼️', label: 'Scan', color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' };
    }
    if (order.photoSource === 'usb' || (order.photoNumber && order.photoNumber.startsWith('USB_'))) {
      return { icon: '💾', label: 'USB', color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' };
    }
    return { icon: '📸', label: 'Camera', color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' };
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* 1. HERO STUDIO CONTROL CENTER HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl border border-slate-800">
        {/* Subtle decorative glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Studio Counter & POS Hub</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Counter Active</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Mansa, Gandhinagar, Gujarat</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{profile.name}</span>
              </h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Photography, Lab Glossy Printing, Ornate Framing & Express Counter Delivery
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenCounterBooking}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4 stroke-[2.5]" />
              <span>+ New Customer Booking</span>
            </button>

            <button
              onClick={() => setActiveTab('photoshoots')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-indigo-400" />
              <span>Photo Counts</span>
            </button>

            <button
              onClick={onOpenRecordPayment}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Receive Payment</span>
            </button>

            <button
              onClick={() => setActiveTab('orders_workflow')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Track Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. REMINDER NOTIFICATIONS RADAR BANNER (Overdue, Due Today, Editing & Payments) */}
      {(() => {
        const overdueOrders = orders.filter(
          (o) => o.deliveryDue < todayStr && o.status !== 'completed' && o.status !== 'delivered'
        );
        const dueTodayOrders = orders.filter(
          (o) => o.deliveryDue === todayStr && o.status !== 'completed' && o.status !== 'delivered'
        );

        if (
          overdueOrders.length === 0 &&
          dueTodayOrders.length === 0 &&
          pendingEditingOrders.length === 0 &&
          unpaidOrders.length === 0 &&
          readyOrders.length === 0
        ) {
          return null;
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {overdueOrders.length > 0 && (
              <div
                onClick={() => setActiveTab('orders_workflow')}
                className="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-between cursor-pointer hover:bg-rose-500/25 transition text-xs group"
              >
                <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-200">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 animate-pulse font-bold">
                    🚨
                  </div>
                  <div>
                    <span className="font-black block">{overdueOrders.length} Overdue Deliveries!</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-300 font-bold">Passed customer due date</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition" />
              </div>
            )}

            {dueTodayOrders.length > 0 && (
              <div
                onClick={() => setActiveTab('orders_workflow')}
                className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-between cursor-pointer hover:bg-amber-500/25 transition text-xs group"
              >
                <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    ⏰
                  </div>
                  <div>
                    <span className="font-black block">{dueTodayOrders.length} Due for Delivery Today</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">Mansa counter pickup today</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition" />
              </div>
            )}

            {pendingEditingOrders.length > 0 && (
              <div
                onClick={() => setActiveTab('orders_workflow')}
                className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between cursor-pointer hover:bg-indigo-500/20 transition text-xs group"
              >
                <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-300">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <span className="font-extrabold block">{pendingEditingOrders.length} Orders in Editing</span>
                    <span className="text-[10px] text-slate-500">Photoshop queue waiting</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition" />
              </div>
            )}

            {readyOrders.length > 0 && (
              <div
                onClick={() => setActiveTab('ready_orders')}
                className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between cursor-pointer hover:bg-emerald-500/20 transition text-xs group"
              >
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="font-extrabold block">{readyOrders.length} Ready for Pickup</span>
                    <span className="text-[10px] text-slate-500">Finished & waiting for client</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition" />
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. MAIN FINANCIAL & OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Revenue */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Today&apos;s Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(stats.todayRevenue)}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span>💵 Cash: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(stats.todayCash)}</strong></span>
            <span>&bull;</span>
            <span>📱 UPI: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(stats.todayUPI)}</strong></span>
          </div>
        </div>

        {/* Today's Orders */}
        <div
          onClick={() => setActiveTab('orders_workflow')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Today&apos;s Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats.todayOrders}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{orders.length} total active orders in workflow</p>
        </div>

        {/* Split Payments Received */}
        <div
          onClick={() => setActiveTab('reports')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Split (Cash + UPI)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {todaySplitOrders.length > 0 ? formatCurrency(totalSplitRevenue) : '₹0'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {todaySplitOrders.length} clients paid half cash/half online
          </p>
        </div>

        {/* Pending Receivables */}
        <div
          onClick={() => setActiveTab('payments')}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Pending Balance</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(stats.totalPendingPayments)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {unpaidOrders.length === 0 ? '✅ All accounts cleared' : `${unpaidOrders.length} clients pending payment`}
          </p>
        </div>
      </div>

      {/* 4. TWO MAIN OPERATIONAL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Studio Orders & Active Workflow (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Recent Studio Orders & Workflow
                </h2>
                <p className="text-[11px] text-slate-400">Live order intake and production tracking</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('orders_workflow')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer"
            >
              <span>View Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {orders.slice(0, 4).map((order) => {
              const src = getSourceIcon(order);
              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-amber-500/40 hover:shadow-xs transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold flex items-center justify-center shrink-0 text-sm">
                      {order.clientName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{order.clientName}</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">#{order.orderNumber}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="capitalize">{order.serviceTitle}</span>
                        <span>&bull;</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-bold ${src.color}`}>
                          <span>{src.icon}</span>
                          <span>{order.photoNumber || src.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                    <span className="px-2.5 py-1 rounded-xl font-extrabold text-[10px] uppercase bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {formatCurrency(order.pricing.finalTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pending Dues & Instant WhatsApp Reminders (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Pending Payment Dues
                </h2>
                <p className="text-[11px] text-slate-400">Customer receivables & balance collection</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {unpaidOrders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <p className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">All Client Balances Cleared</p>
                <p className="text-xs text-slate-500">Zero outstanding dues currently on file.</p>
              </div>
            ) : (
              unpaidOrders.slice(0, 3).map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{ord.clientName}</h4>
                    <p className="text-[11px] text-slate-500">Due Date: {ord.deliveryDue}</p>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(ord.payment.balanceDue)}
                    </span>
                    <button
                      onClick={() => sendWhatsAppReminder(ord)}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs active:scale-95 cursor-pointer"
                      title="Send WhatsApp Reminder"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
