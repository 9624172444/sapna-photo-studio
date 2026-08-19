import React, { useState } from 'react';
import { StudioOrder, PaymentMode, UpiApp } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { buildInvoiceWhatsAppText } from '../../services/whatsappService';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  Search,
  Send,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { orders, recordOrderPayment, formatCurrency, profile, currentRole } = useStudio();

  const [activeTab, setActiveTab] = useState<'all' | 'unpaid'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<StudioOrder | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [upiApp, setUpiApp] = useState<UpiApp>('gpay');
  const [paymentRef, setPaymentRef] = useState('');

  let totalCash = 0;
  let totalOnline = 0;
  let totalCollected = 0;

  orders.forEach((o) => {
    totalCollected += o.payment.advancePaid;
    if (o.payment.mode === 'cash') totalCash += o.payment.advancePaid;
    else totalOnline += o.payment.advancePaid;
  });

  const totalPending = orders.reduce((sum, o) => sum + (o.payment.balanceDue || 0), 0);
  const unpaidOrders = orders.filter((o) => o.payment.balanceDue > 0);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matches =
      o.clientName.toLowerCase().includes(q) ||
      o.mobileNumber.includes(q) ||
      o.orderNumber.toLowerCase().includes(q);

    if (!matches) return false;
    if (modeFilter === 'cash') return o.payment.mode === 'cash';
    if (modeFilter === 'online') return o.payment.mode !== 'cash';
    return true;
  });

  const handleShareWhatsAppReminder = (ord: StudioOrder) => {
    const text = buildInvoiceWhatsAppText(ord, profile);
    const phone = (ord.whatsappNumber || ord.mobileNumber).replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForPayment) return;
    if (paymentAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    recordOrderPayment(
      selectedOrderForPayment.id,
      paymentAmount,
      paymentMode,
      paymentMode === 'upi' ? upiApp : undefined,
      paymentRef || (paymentMode === 'cash' ? 'CASH-PAYMENT' : 'UPI-PAYMENT'),
      `${currentRole.toUpperCase()} User`
    );

    setSelectedOrderForPayment(null);
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span>Cash in Hand & Online Payment Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track physical cash vs online UPI collections and follow up pending balances
          </p>
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Payments ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'unpaid'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Pending Dues ({unpaidOrders.length})
          </button>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>💵 Cash in Hand</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {formatCurrency(totalCash)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Physical cash in studio drawer</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>📱 Online (UPI / Bank)</span>
            <Smartphone className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1.5">
            {formatCurrency(totalOnline)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">GPay, PhonePe, Bank transfers</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>⚠️ Pending to Collect</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1.5">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{unpaidOrders.length} clients owe balance</p>
        </div>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client or order #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Modes' },
                { id: 'cash', label: '💵 Cash Only' },
                { id: 'online', label: '📱 Online Only' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModeFilter(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    modeFilter === m.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Total Bill</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{ord.clientName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">#{ord.orderNumber}</p>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {ord.serviceCategory.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4">
                      {ord.payment.mode === 'cash' ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400">
                          💵 Cash
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
                          📱 Online ({ord.payment.upiApp?.toUpperCase() || 'UPI'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(ord.pricing.finalTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      {formatCurrency(ord.payment.advancePaid)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {ord.payment.balanceDue > 0 ? (
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                          {formatCurrency(ord.payment.balanceDue)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold font-mono text-xs">{formatCurrency(0)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ord.payment.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOrderForPayment(ord);
                            setPaymentAmount(ord.payment.balanceDue);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition"
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Unpaid Balances Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {unpaidOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-500/30 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{ord.clientName}</h3>
                  <p className="text-xs text-slate-500">
                    {ord.mobileNumber} &bull; {ord.serviceTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">#{ord.orderNumber} &bull; Due: {ord.deliveryDue}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Balance Due</span>
                  <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                    {formatCurrency(ord.payment.balanceDue)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleShareWhatsAppReminder(ord)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Reminder</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedOrderForPayment(ord);
                    setPaymentAmount(ord.payment.balanceDue);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collect Payment Modal */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Receive Payment</h3>
              </div>
              <button onClick={() => setSelectedOrderForPayment(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedOrderForPayment.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Order:</span>
                  <span className="font-mono text-slate-900 dark:text-white">#{selectedOrderForPayment.orderNumber}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-rose-500">Pending Balance:</span>
                  <span className="text-rose-500 text-sm">{formatCurrency(selectedOrderForPayment.payment.balanceDue)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Amount Received ({profile.currency}) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedOrderForPayment.payment.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-base font-extrabold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="upi">📱 UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">💵 Cash in Hand</option>
                  <option value="card">💳 Card / POS</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
