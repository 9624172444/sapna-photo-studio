import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  TrendingUp,
  Calendar,
  Banknote,
  Smartphone,
  AlertTriangle,
  Receipt,
  PieChart,
  DollarSign,
  Download,
  Users,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { orders, formatCurrency } = useStudio();
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'services'>('daily');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'upi' | 'split'>('all');

  // Compute Daily Totals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt === todayStr);

  let todayRevenue = 0;
  let todayCash = 0;
  let todayUPI = 0;
  let todaySplitCount = 0;
  let todaySplitCash = 0;
  let todaySplitUPI = 0;

  todayOrders.forEach((o) => {
    todayRevenue += o.payment.advancePaid;
    if (o.payment.mode === 'cash') {
      todayCash += o.payment.advancePaid;
    } else if (o.payment.mode === 'split') {
      const cashPart = o.payment.splitDetails?.cashAmount ?? Math.round(o.payment.advancePaid / 2);
      const onlinePart = o.payment.splitDetails?.onlineAmount ?? (o.payment.advancePaid - cashPart);
      todayCash += cashPart;
      todayUPI += onlinePart;
      todaySplitCount += 1;
      todaySplitCash += cashPart;
      todaySplitUPI += onlinePart;
    } else {
      todayUPI += o.payment.advancePaid;
    }
  });

  const totalPendingDues = orders.reduce((sum, o) => sum + (o.payment.balanceDue || 0), 0);

  const filteredTodayOrders = todayOrders.filter((o) => {
    if (modeFilter === 'all') return true;
    if (modeFilter === 'cash') return o.payment.mode === 'cash';
    if (modeFilter === 'upi') return o.payment.mode === 'upi';
    if (modeFilter === 'split') return o.payment.mode === 'split';
    return true;
  });

  // Compute Monthly Totals
  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-08'
  const monthOrders = orders.filter((o) => o.createdAt.startsWith(currentMonth));
  const monthTotalRevenue = monthOrders.reduce((sum, o) => sum + o.payment.advancePaid, 0);
  const estimatedExpenses = Math.round(monthTotalRevenue * 0.25); // ~25% lab/printing/framing costs
  const netProfit = Math.max(0, monthTotalRevenue - estimatedExpenses);

  // Service Breakdown
  const serviceCounts: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((o) => {
    const cat = o.serviceCategory || 'custom_service';
    if (!serviceCounts[cat]) {
      serviceCounts[cat] = { count: 0, revenue: 0 };
    }
    serviceCounts[cat].count += 1;
    serviceCounts[cat].revenue += o.pricing.finalTotal;
  });

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Studio Analytics & Financial Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily cash drawer, UPI collections, half cash/half online breakdown & monthly revenue
          </p>
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          {[
            { id: 'daily', label: '📅 Daily Report' },
            { id: 'monthly', label: '📊 Monthly Report' },
            { id: 'services', label: '🎯 Service Stats' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                reportType === r.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* DAILY REPORT VIEW */}
      {reportType === 'daily' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Today&apos;s Customers</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {todayOrders.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{todayOrders.length} counter bookings</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">💵 Total Cash in Hand</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(todayCash)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Direct Cash + Split Cash</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">📱 Total Online UPI / Bank</span>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatCurrency(todayUPI)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">GPay/PhonePe + Split Online</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">💰 Total Daily Collection</span>
              <p className="text-2xl font-extrabold text-amber-500 mt-1">
                {formatCurrency(todayRevenue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Combined Cash + Online</p>
            </div>
          </div>

          {/* DEDICATED HALF ONLINE & HALF CASH (SPLIT PAYMENT) SECTION */}
          <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-emerald-500/15 p-4 sm:p-5 rounded-2xl border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Half Online & Half Cash (Split Payments)
                </h3>
                <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  {todaySplitCount} Orders
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Detailed register breakdown of clients who paid part cash and part online UPI.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs text-center">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">💵 Split Cash</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(todaySplitCash)}</p>
              </div>

              <span className="text-sm font-black text-slate-400">+</span>

              <div className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-indigo-500/40 shadow-xs text-center">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">📱 Split Online</span>
                <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(todaySplitUPI)}</p>
              </div>

              <span className="text-sm font-black text-slate-400">=</span>

              <div className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl font-bold shadow-xs text-center">
                <span className="text-[10px] uppercase block font-extrabold text-slate-900/80">Total Split</span>
                <p className="text-sm font-black">{formatCurrency(todaySplitCash + todaySplitUPI)}</p>
              </div>
            </div>
          </div>

          {/* Today's Orders Table with Mode Filter */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Today&apos;s Orders List ({filteredTodayOrders.length})
              </h3>

              {/* Mode Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Filter Mode:</span>
                {[
                  { id: 'all', label: 'All Modes' },
                  { id: 'cash', label: '💵 Cash Only' },
                  { id: 'upi', label: '📱 Online UPI' },
                  { id: 'split', label: '⚡ Half Online + Cash' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setModeFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                      modeFilter === f.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTodayOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No orders matching selected payment mode.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5 px-3">Order #</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3">Payment Mode & Breakdown</th>
                      <th className="py-2.5 px-3 text-right">Bill Total</th>
                      <th className="py-2.5 px-3 text-right">Paid Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTodayOrders.map((o) => {
                      const isSplit = o.payment.mode === 'split';
                      const cashPart = o.payment.splitDetails?.cashAmount ?? Math.round(o.payment.advancePaid / 2);
                      const onlinePart = o.payment.splitDetails?.onlineAmount ?? (o.payment.advancePaid - cashPart);
                      const onlineApp = o.payment.splitDetails?.upiApp || o.payment.upiApp || 'UPI';

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {o.orderNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {o.clientName}
                          </td>
                          <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-300">
                            {o.serviceCategory.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2.5 px-3">
                            {isSplit ? (
                              <div className="inline-flex flex-col gap-0.5 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-xl">
                                <span className="font-extrabold text-[10px] text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                  <span>⚡ Split Payment</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                  💵 Cash: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(cashPart)}</strong> + 📱 {onlineApp.toUpperCase()}: <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(onlinePart)}</strong>
                                </span>
                              </div>
                            ) : o.payment.mode === 'cash' ? (
                              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                💵 Cash in Hand
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                📱 UPI ({onlineApp.toUpperCase()})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-600 dark:text-slate-300">
                            {formatCurrency(o.pricing.finalTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(o.payment.advancePaid)}
                            </p>
                            {isSplit && (
                              <p className="text-[9px] text-slate-400">
                                (💵 {formatCurrency(cashPart)} + 📱 {formatCurrency(onlinePart)})
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONTHLY REPORT VIEW */}
      {reportType === 'monthly' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Monthly Total Revenue</span>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(monthTotalRevenue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{monthOrders.length} total monthly orders</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Estimated Lab & Print Expenses</span>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(estimatedExpenses)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Photo paper, albums, acrylic frames</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Net Studio Profit</span>
              <p className="text-2xl font-extrabold text-amber-500 mt-1">
                {formatCurrency(netProfit)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Revenue minus lab costs</p>
            </div>
          </div>
        </div>
      )}

      {/* SERVICE BREAKDOWN VIEW */}
      {reportType === 'services' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Most Popular Studio Services & Revenue Breakdown
          </h3>

          <div className="space-y-3">
            {Object.entries(serviceCounts).map(([cat, data]) => {
              const percent = Math.round((data.count / orders.length) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="capitalize">{cat.replace('_', ' ')}</span>
                    <span>
                      {data.count} Orders ({percent}%) &bull; <strong>{formatCurrency(data.revenue)}</strong>
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="bg-amber-500 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
