import React, { useState } from 'react';
import { StudioOrder, Invoice, DeletedOrder } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { InvoicePrintModal } from './InvoicePrintModal';
import { InvoiceEditModal } from './InvoiceEditModal';
import { WhatsAppImageInvoiceModal } from './WhatsAppImageInvoiceModal';
import {
  Search,
  Plus,
  Receipt,
  Printer,
  Trash2,
  Share2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Edit3,
  MessageSquare,
  RotateCcw,
  Archive,
  RefreshCw,
  X,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface BillingViewProps {
  onOpenRecordPayment: (invoice?: any) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ onOpenRecordPayment }) => {
  const {
    orders,
    deletedOrders,
    deleteOrder,
    restoreOrder,
    permanentlyDeleteOrder,
    emptyTrash,
    formatCurrency,
    profile,
  } = useStudio();

  const [viewTab, setViewTab] = useState<'active' | 'deleted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<StudioOrder | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<StudioOrder | null>(null);
  const [selectedOrderForWhatsAppImage, setSelectedOrderForWhatsAppImage] = useState<StudioOrder | null>(null);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalBilled = orders.reduce((sum, o) => sum + (o.pricing.finalTotal || 0), 0);
  const totalCollected = orders.reduce((sum, o) => sum + (o.payment.advancePaid || 0), 0);
  const totalPending = orders.reduce((sum, o) => sum + (o.payment.balanceDue || 0), 0);

  const filteredOrders = orders.filter((ord) => {
    const q = searchQuery.toLowerCase();
    const matches =
      ord.clientName.toLowerCase().includes(q) ||
      ord.invoiceNumber.toLowerCase().includes(q) ||
      ord.mobileNumber.includes(q);
    if (!matches) return false;
    if (statusFilter === 'unpaid') return ord.payment.balanceDue > 0;
    if (statusFilter === 'paid') return ord.payment.balanceDue === 0;
    return true;
  });

  const filteredDeletedOrders = deletedOrders.filter((ord) => {
    const q = searchQuery.toLowerCase();
    return (
      ord.clientName.toLowerCase().includes(q) ||
      ord.invoiceNumber.toLowerCase().includes(q) ||
      ord.mobileNumber.includes(q)
    );
  });

  const handleDeleteWithUndo = (ord: StudioOrder) => {
    deleteOrder(ord.id);
    setLastDeletedId(ord.id);
    setToastMessage(`Invoice #${ord.invoiceNumber} moved to Recently Deleted`);
    setTimeout(() => {
      setToastMessage((prev) => (prev?.includes(ord.invoiceNumber) ? null : prev));
    }, 6000);
  };

  const handleUndoDelete = (id: string) => {
    restoreOrder(id);
    setLastDeletedId(null);
    setToastMessage('✅ Invoice restored successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWhatsAppShare = (ord: StudioOrder) => {
    const text = `*Tax Invoice #${ord.invoiceNumber} from ${profile.name}*\n\nDear ${ord.clientName},\n*Service:* ${ord.serviceTitle}\n*Total Bill:* ${formatCurrency(ord.pricing.finalTotal)}\n*Advance Paid:* ${formatCurrency(ord.payment.advancePaid)}\n*Balance Due:* ${formatCurrency(ord.payment.balanceDue)}\n\n*Pay via UPI:* ${profile.upiId}\nBank: ${profile.bankName} (A/C: ${profile.accountNumber}, IFSC: ${profile.ifscCode})\n\nThank you!`;
    const cleanPhone = ord.mobileNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      {/* Toast Notification Banner (with Instant Undo) */}
      {toastMessage && (
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastDeletedId && (
              <button
                onClick={() => handleUndoDelete(lastDeletedId)}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo / Recover</span>
              </button>
            )}
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Active / Recently Deleted Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>Client Invoices & Dynamic UPI QR Bills</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated invoices with camera photo count breakdown, instant scan-to-pay QR & recovery trash
          </p>
        </div>

        {/* View Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Invoices ({orders.length})</span>
          </button>

          <button
            onClick={() => setViewTab('deleted')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              viewTab === 'deleted'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recently Deleted ({deletedOrders.length})</span>
          </button>
        </div>
      </div>

      {viewTab === 'active' ? (
        <>
          {/* 3 Quick Financial Totals */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Total Invoiced</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalBilled)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Total Collected</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalCollected)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-semibold">Balance Due</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {formatCurrency(totalPending)}
              </p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by client or invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Invoices' },
                { id: 'unpaid', label: 'Pending Dues' },
                { id: 'paid', label: 'Fully Paid' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    statusFilter === f.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices List - Desktop Table & Mobile Cards */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2 animate-fade-in-up">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">No invoices found matching your search</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md screens) */}
              <div className="space-y-3 md:hidden">
                {filteredOrders.map((ord, idx) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs animate-fade-in-up interactive-card"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        #{ord.invoiceNumber}
                      </span>
                      {ord.payment.balanceDue === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                          <AlertCircle className="w-3 h-3" /> Pending: {formatCurrency(ord.payment.balanceDue)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ord.clientName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ord.serviceTitle} &bull; 📞 {ord.mobileNumber}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Total</span>
                        <strong className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(ord.pricing.finalTotal)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Paid</span>
                        <strong className="font-mono font-bold text-emerald-600">{formatCurrency(ord.payment.advancePaid)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Date</span>
                        <span className="text-slate-600 dark:text-slate-300 text-[10px] font-medium">{ord.createdAt}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedOrderForWhatsAppImage(ord)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrderForPrint(ord)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrderForEdit(ord)}
                        className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white transition"
                        title="Edit Invoice"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteWithUndo(ord)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md screens) */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-fade-in-up">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Client & Service</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Total Bill</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Balance Due</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {ord.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{ord.clientName}</span>
                              {ord.mobileNumber && (
                                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  📞 {ord.mobileNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px]">
                              <span className="text-slate-400 capitalize">{ord.serviceTitle}</span>
                              {ord.photoNumber && (
                                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                  📷 {ord.photoNumber}
                                </span>
                              )}
                              {ord.passportSpecs?.attireType === 'suit' && (
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                                  👔 Suit
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {ord.createdAt}
                          </td>
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(ord.pricing.finalTotal)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(ord.payment.advancePaid)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {ord.payment.balanceDue > 0 ? (
                              <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm font-mono">
                                {formatCurrency(ord.payment.balanceDue)}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold font-mono text-xs">{formatCurrency(0)}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {ord.payment.balanceDue === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
                                <AlertCircle className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* Edit Bill */}
                              <button
                                title="Edit Client Invoice & Line Items"
                                onClick={() => setSelectedOrderForEdit(ord)}
                                className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Print / View */}
                              <button
                                title="View / Print Bill with UPI QR"
                                onClick={() => setSelectedOrderForPrint(ord)}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Image Invoice */}
                              <button
                                title="Send Image Invoice on WhatsApp"
                                onClick={() => setSelectedOrderForWhatsAppImage(ord)}
                                className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete with Undo */}
                              <button
                                title="Move to Recently Deleted (Recoverable)"
                                onClick={() => handleDeleteWithUndo(ord)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* RECENTLY DELETED INVOICES / RECYCLE RECOVERY SECTION */
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Recently Deleted Invoices ({deletedOrders.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Accidentally deleted an invoice? You can 1-click recover and restore it back to active invoices anytime.
                </p>
              </div>
            </div>

            {deletedOrders.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to permanently delete all invoices in trash? This cannot be undone.')) {
                    emptyTrash();
                    setToastMessage('Recycle bin emptied.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white font-bold text-xs transition border border-rose-500/30 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Empty Trash</span>
              </button>
            )}
          </div>

          {/* Search Deleted */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search recently deleted invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Deleted Invoices List */}
          {filteredDeletedOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Recycle Bin is Empty
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No deleted invoices found. Any invoice you delete in the future will be stored here for instant recovery.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold">
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Client & Service</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Deleted At</th>
                      <th className="py-3 px-4">Deleted By</th>
                      <th className="py-3 px-4 text-center">Recovery Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredDeletedOrders.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <span className="line-through text-slate-400 mr-1.5">{del.invoiceNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{del.clientName}</p>
                          <p className="text-[11px] text-slate-400">{del.serviceTitle} &bull; 📞 {del.mobileNumber}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(del.pricing.finalTotal)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(del.deletedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {del.deletedBy || 'Admin User'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {/* ♻️ Restore / Recover */}
                            <button
                              onClick={() => {
                                restoreOrder(del.id);
                                setToastMessage(`✅ Invoice #${del.invoiceNumber} recovered & restored!`);
                                setTimeout(() => setToastMessage(null), 4000);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                              title="Recover and restore invoice to active list"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Recover</span>
                            </button>

                            {/* 🗑️ Delete Permanently */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Permanently delete invoice #${del.invoiceNumber}? This cannot be undone.`)) {
                                  permanentlyDeleteOrder(del.id);
                                  setToastMessage(`Invoice #${del.invoiceNumber} permanently removed.`);
                                  setTimeout(() => setToastMessage(null), 3000);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Edit Modal */}
      {selectedOrderForEdit && (
        <InvoiceEditModal
          order={selectedOrderForEdit}
          onClose={() => setSelectedOrderForEdit(null)}
          onSaved={() => setSelectedOrderForEdit(null)}
        />
      )}

      {/* WhatsApp Image Invoice Modal */}
      {selectedOrderForWhatsAppImage && (
        <WhatsAppImageInvoiceModal
          order={selectedOrderForWhatsAppImage}
          onClose={() => setSelectedOrderForWhatsAppImage(null)}
        />
      )}

      {selectedOrderForPrint && (
        <InvoicePrintModal
          invoice={{
            id: selectedOrderForPrint.id,
            invoiceNumber: selectedOrderForPrint.invoiceNumber,
            clientId: selectedOrderForPrint.customerId,
            clientName: selectedOrderForPrint.clientName,
            clientPhone: selectedOrderForPrint.mobileNumber,
            clientEmail: '',
            eventType: selectedOrderForPrint.serviceCategory,
            eventDate: selectedOrderForPrint.photoshootDate || selectedOrderForPrint.createdAt,
            eventVenue: 'Lumina Studio & Color Lab',
            issueDate: selectedOrderForPrint.createdAt,
            dueDate: selectedOrderForPrint.deliveryDue,
            items: [
              {
                id: 'item-1',
                name: selectedOrderForPrint.serviceTitle,
                description: `Photoshoot ID: ${selectedOrderForPrint.photoshootId || 'N/A'} • Camera: ${selectedOrderForPrint.cameraUsed || 'Studio'}`,
                quantity: 1,
                rate: selectedOrderForPrint.pricing.basePackagePrice,
                amount: selectedOrderForPrint.pricing.basePackagePrice,
              },
              ...(selectedOrderForPrint.pricing.extraPhotoTotal > 0
                ? [
                    {
                      id: 'item-2',
                      name: `Extra Selected Photos (${selectedOrderForPrint.photoCount.extraSelected} photos @ ₹${selectedOrderForPrint.photoCount.extraPhotoRate}/each)`,
                      quantity: selectedOrderForPrint.photoCount.extraSelected,
                      rate: selectedOrderForPrint.photoCount.extraPhotoRate,
                      amount: selectedOrderForPrint.pricing.extraPhotoTotal,
                    },
                  ]
                : []),
            ],
            subtotal: selectedOrderForPrint.pricing.subtotal,
            discount: selectedOrderForPrint.pricing.discount,
            discountType: 'flat',
            taxRate: 0,
            taxAmount: 0,
            total: selectedOrderForPrint.pricing.finalTotal,
            paidAmount: selectedOrderForPrint.payment.advancePaid,
            balanceDue: selectedOrderForPrint.payment.balanceDue,
            status: selectedOrderForPrint.payment.balanceDue === 0 ? 'paid' : 'partially_paid',
            createdAt: selectedOrderForPrint.createdAt,
          }}
          onClose={() => setSelectedOrderForPrint(null)}
        />
      )}
    </div>
  );
};
