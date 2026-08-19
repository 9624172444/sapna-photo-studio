import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { StudioOrder, PaymentMode, UpiApp } from '../../types';
import { InvoicePrintModal } from '../billing/InvoicePrintModal';
import {
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Printer,
  DollarSign,
  Calendar,
  ArrowRight,
} from 'lucide-react';

export const PendingPaymentsView: React.FC = () => {
  const { orders, recordOrderPayment, formatCurrency, profile } = useStudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<StudioOrder | null>(null);

  // Quick Payment Modal State
  const [payingOrder, setPayingOrder] = useState<StudioOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [upiApp, setUpiApp] = useState<UpiApp>('gpay');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitOnline, setSplitOnline] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>('');

  const unpaidOrders = orders.filter((o) => (o.payment.balanceDue || 0) > 0);
  const totalPendingAmount = unpaidOrders.reduce((sum, o) => sum + (o.payment.balanceDue || 0), 0);

  const filteredOrders = unpaidOrders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.clientName.toLowerCase().includes(q) ||
      o.mobileNumber.includes(q) ||
      o.orderNumber.toLowerCase().includes(q)
    );
  });

  const handleOpenPaymentModal = (order: StudioOrder) => {
    setPayingOrder(order);
    const due = order.payment.balanceDue;
    setPaymentAmount(due);
    setPaymentMode('upi');
    setUpiApp('gpay');
    const half = Math.round(due / 2);
    setSplitCash(half);
    setSplitOnline(due - half);
    setTransactionRef('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingOrder) return;

    const actualAmount = paymentMode === 'split' ? splitCash + splitOnline : paymentAmount;
    if (actualAmount <= 0) return;

    const splitNote =
      paymentMode === 'split'
        ? ` (Split: 💵 Cash ₹${splitCash} + 📱 Online ₹${splitOnline})`
        : '';

    recordOrderPayment(
      payingOrder.id,
      actualAmount,
      paymentMode,
      paymentMode === 'upi' || paymentMode === 'split' ? upiApp : undefined,
      transactionRef ? `${transactionRef}${splitNote}` : `COLLECT-${Date.now()}${splitNote}`
    );

    setPayingOrder(null);
  };

  const handleSendReminderWhatsApp = (order: StudioOrder) => {
    const text = `Hello ${order.clientName}! Greetings from ${profile.name}, Mansa.\n\nThis is a friendly reminder for Order *${order.orderNumber}* (${order.serviceTitle}):\n• Total Bill: ${formatCurrency(order.pricing.finalTotal)}\n• Advance Paid: ${formatCurrency(order.payment.advancePaid)}\n• *Pending Balance: ${formatCurrency(order.payment.balanceDue)}*\n\nPlease clear the balance upon collection. Thank you!`;
    const phone = (order.whatsappNumber || order.mobileNumber).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            <span>Pending Payments & Customer Dues</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and collect remaining balances from client photoshoots, frames & prints
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Total Pending Balance
            </span>
            <span className="text-2xl font-black text-rose-700 dark:text-rose-300">
              {formatCurrency(totalPendingAmount)}
            </span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Unpaid / Partial Orders
            </span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {unpaidOrders.length} Orders
            </span>
          </div>
          <CreditCard className="w-8 h-8 text-amber-500/40" />
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Settlement Status
            </span>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              Ready to Collect at Counter
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Order & Customer</th>
                <th className="px-5 py-3">Service & Delivery</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3 text-emerald-600">Advance Paid</th>
                <th className="px-5 py-3 text-rose-600">Balance Pending</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                    No pending payments found! All client accounts are fully settled.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          {order.clientName}
                        </h4>
                        <p className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{order.mobileNumber}</span>
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {order.serviceTitle}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Due: {order.deliveryDue}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(order.pricing.finalTotal)}
                    </td>

                    <td className="px-5 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(order.payment.advancePaid)}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg inline-block">
                        {formatCurrency(order.payment.balanceDue)}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPaymentModal(order)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Collect ₹</span>
                        </button>

                        <button
                          onClick={() => handleSendReminderWhatsApp(order)}
                          className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                          title="WhatsApp Balance Reminder"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {payingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Record Balance Payment
                </h3>
              </div>
              <button
                onClick={() => setPayingOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {payingOrder.clientName}
              </p>
              <p className="text-slate-500">{payingOrder.serviceTitle}</p>
              <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  {formatCurrency(payingOrder.payment.balanceDue)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount to Collect (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  max={payingOrder.payment.balanceDue}
                  min={1}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500 text-base font-extrabold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMode === 'cash'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMode === 'upi'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    📱 UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('split');
                      const due = payingOrder?.payment.balanceDue || 0;
                      const half = Math.round(due / 2);
                      setSplitCash(half);
                      setSplitOnline(due - half);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMode === 'split'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ⚡ Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('card')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      paymentMode === 'card'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💳 Card
                  </button>
                </div>
              </div>

              {/* SPLIT BREAKDOWN */}
              {paymentMode === 'split' && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-900 dark:text-amber-300">⚡ Split Breakdown</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Total: {formatCurrency(splitCash + splitOnline)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        💵 Cash Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={splitCash || ''}
                        onChange={(e) => setSplitCash(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        📱 UPI Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={splitOnline || ''}
                        onChange={(e) => setSplitOnline(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(paymentMode === 'upi' || paymentMode === 'split') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    UPI App for Online Portion
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gpay', label: 'GPay' },
                      { id: 'phonepe', label: 'PhonePe' },
                      { id: 'paytm', label: 'Paytm' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setUpiApp(app.id as any)}
                        className={`p-1.5 rounded-lg text-xs font-semibold border ${
                          upiApp === app.id
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {app.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Transaction Reference / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cash receipt"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingOrder(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoicePrintModal
          invoice={{
            id: selectedInvoiceOrder.id,
            invoiceNumber: selectedInvoiceOrder.invoiceNumber,
            clientId: selectedInvoiceOrder.customerId,
            clientName: selectedInvoiceOrder.clientName,
            clientPhone: selectedInvoiceOrder.mobileNumber,
            clientEmail: '',
            eventType: selectedInvoiceOrder.serviceCategory as any,
            eventDate: selectedInvoiceOrder.photoshootDate || selectedInvoiceOrder.createdAt,
            eventVenue: profile.name,
            issueDate: selectedInvoiceOrder.createdAt,
            dueDate: selectedInvoiceOrder.deliveryDue,
            items: [
              {
                id: '1',
                name: selectedInvoiceOrder.serviceTitle,
                description: `${selectedInvoiceOrder.photoNumber ? `Photo #${selectedInvoiceOrder.photoNumber} • ` : ''}${selectedInvoiceOrder.notes || 'Studio Production'}`,
                quantity: selectedInvoiceOrder.passportSpecs?.quantity || 1,
                rate: selectedInvoiceOrder.pricing.basePackagePrice,
                amount: selectedInvoiceOrder.pricing.finalTotal,
              },
            ],
            subtotal: selectedInvoiceOrder.pricing.subtotal,
            discount: selectedInvoiceOrder.pricing.discount,
            discountType: 'flat',
            taxRate: 0,
            taxAmount: selectedInvoiceOrder.pricing.taxAmount,
            total: selectedInvoiceOrder.pricing.finalTotal,
            paidAmount: selectedInvoiceOrder.payment.advancePaid,
            balanceDue: selectedInvoiceOrder.payment.balanceDue,
            status: selectedInvoiceOrder.payment.balanceDue === 0 ? 'paid' : 'partially_paid',
            notes: selectedInvoiceOrder.notes,
            terms: profile.defaultTerms.join(' • '),
            createdAt: selectedInvoiceOrder.createdAt,
          }}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
