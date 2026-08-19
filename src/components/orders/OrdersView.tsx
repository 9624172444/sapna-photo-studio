import React, { useState } from 'react';
import { StudioOrder, OrderStatus, DeletedOrder } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { InvoicePrintModal } from '../billing/InvoicePrintModal';
import { InvoiceEditModal } from '../billing/InvoiceEditModal';
import { WhatsAppImageInvoiceModal } from '../billing/WhatsAppImageInvoiceModal';
import { buildInvoiceWhatsAppText } from '../../services/whatsappService';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Trash2,
  Edit2,
  Edit3,
  ChevronRight,
  Filter,
  User,
  Phone,
  Camera,
  MessageSquare,
  RotateCcw,
  Archive,
  X,
} from 'lucide-react';

const ORDER_STAGES: { id: OrderStatus; label: string; icon: string; stepGroup: number }[] = [
  { id: 'new_order', label: '1. New Order Created', icon: '📝', stepGroup: 1 },
  { id: 'photoshoot_completed', label: '2. Photoshoot Completed', icon: '📷', stepGroup: 2 },
  { id: 'photo_selection_pending', label: '3. Photo Selection Pending', icon: '⏳', stepGroup: 3 },
  { id: 'photos_selected', label: '4. Photos Selected by Client', icon: '✅', stepGroup: 3 },
  { id: 'editing_pending', label: '5. Editing Pending', icon: '🎨', stepGroup: 4 },
  { id: 'editing_in_progress', label: '6. Editing in Progress', icon: '⚡', stepGroup: 4 },
  { id: 'editing_completed', label: '7. Editing Completed', icon: '✨', stepGroup: 4 },
  { id: 'client_approval_pending', label: '8. Client Approval Pending', icon: '👀', stepGroup: 5 },
  { id: 'printing_pending', label: '9. Printing / Lab Pending', icon: '🖨️', stepGroup: 6 },
  { id: 'production_in_progress', label: '10. Production in Progress', icon: '📦', stepGroup: 6 },
  { id: 'ready_for_delivery', label: '11. Ready for Delivery', icon: '🎁', stepGroup: 7 },
  { id: 'delivered', label: '12. Handed Over / Delivered', icon: '🤝', stepGroup: 8 },
  { id: 'completed', label: '13. Order Completed', icon: '🎉', stepGroup: 8 },
];

export const OrdersView: React.FC = () => {
  const {
    orders,
    deletedOrders,
    updateOrderStatus,
    deleteOrder,
    restoreOrder,
    permanentlyDeleteOrder,
    emptyTrash,
    formatCurrency,
    currentRole,
    profile,
  } = useStudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'active' | 'ready' | 'completed' | 'deleted'>('all');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<StudioOrder | null>(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<StudioOrder | null>(null);
  const [selectedOrderForWhatsAppImage, setSelectedOrderForWhatsAppImage] = useState<StudioOrder | null>(null);
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'delivered').length;
  const readyCount = orders.filter((o) => o.status === 'ready_for_delivery').length;
  const completedCount = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;

  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase();
    const matches =
      o.clientName.toLowerCase().includes(query) ||
      o.mobileNumber.includes(query) ||
      o.orderNumber.toLowerCase().includes(query) ||
      o.invoiceNumber.toLowerCase().includes(query) ||
      (o.photoNumber && o.photoNumber.toLowerCase().includes(query)) ||
      (o.photoshootId && o.photoshootId.toLowerCase().includes(query));

    if (!matches) return false;
    if (stageFilter === 'active') return o.status !== 'completed' && o.status !== 'delivered';
    if (stageFilter === 'ready') return o.status === 'ready_for_delivery';
    if (stageFilter === 'completed') return o.status === 'completed' || o.status === 'delivered';
    return true;
  });

  const handleDeleteOrderWithUndo = (order: StudioOrder) => {
    deleteOrder(order.id);
    setLastDeletedId(order.id);
    setToastMessage(`Order #${order.orderNumber} (${order.clientName}) moved to Recently Deleted`);
    setTimeout(() => {
      setToastMessage((prev) => (prev?.includes(order.orderNumber) ? null : prev));
    }, 6000);
  };

  const handleUndoOrderDelete = (id: string) => {
    restoreOrder(id);
    setLastDeletedId(null);
    setToastMessage('✅ Order restored successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareWhatsApp = (order: StudioOrder) => {
    const text = buildInvoiceWhatsAppText(order, profile);
    const phone = (order.whatsappNumber || order.mobileNumber).replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
                onClick={() => handleUndoOrderDelete(lastDeletedId)}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            <span>Order Tracking & 13-Stage Production Workflow</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer journey from shoot to editing, lab printing, and delivery
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'active', label: `⚡ Active Work (${activeCount})` },
            { id: 'ready', label: `🎁 Ready (${readyCount})` },
            { id: 'completed', label: `✅ Completed (${completedCount})` },
            { id: 'deleted', label: `🗑️ Deleted (${deletedOrders.length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStageFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                stageFilter === f.id
                  ? f.id === 'deleted'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Client Name, Mobile, Order #, Photoshoot #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Orders List with 13-stage Workflow timeline OR Deleted Orders */}
      <div className="space-y-4">
        {stageFilter === 'deleted' ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Recently Deleted Orders ({deletedOrders.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accidentally deleted an order? You can 1-click recover and restore it back to active production workflow anytime.
                  </p>
                </div>
              </div>

              {deletedOrders.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to permanently delete all orders in trash? This cannot be undone.')) {
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

            {deletedOrders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Archive className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  No Deleted Orders
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Recycle bin is currently empty. Any order deleted in the future will appear here for recovery.
                </p>
              </div>
            ) : (
              deletedOrders
                .filter((del) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    del.clientName.toLowerCase().includes(q) ||
                    del.mobileNumber.includes(q) ||
                    del.orderNumber.toLowerCase().includes(q) ||
                    del.invoiceNumber.toLowerCase().includes(q)
                  );
                })
                .map((del) => (
                  <div
                    key={del.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 opacity-90"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-400 line-through text-xs sm:text-sm">
                            #{del.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[10px]">
                            DELETED
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                          {del.clientName} &bull; <span className="text-xs font-normal text-slate-400">{del.mobileNumber}</span>
                        </h3>
                        <p className="text-xs text-slate-500">{del.serviceTitle}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-400">Total:</span>
                        <strong className="block text-base font-extrabold font-mono text-slate-900 dark:text-white">
                          {formatCurrency(del.pricing.finalTotal)}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          Deleted: {new Date(del.deletedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {/* ♻️ Restore Order */}
                      <button
                        onClick={() => {
                          restoreOrder(del.id);
                          setToastMessage(`✅ Order #${del.orderNumber} restored successfully!`);
                          setTimeout(() => setToastMessage(null), 4000);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recover & Restore Order</span>
                      </button>

                      {/* 🗑️ Delete Permanently */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Permanently delete order #${del.orderNumber}? This cannot be undone.`)) {
                            permanentlyDeleteOrder(del.id);
                            setToastMessage(`Order #${del.orderNumber} permanently removed.`);
                            setTimeout(() => setToastMessage(null), 3000);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No orders found matching this filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentStageIndex = ORDER_STAGES.findIndex((s) => s.id === order.status);
            const isCompleted = order.status === 'completed' || order.status === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-indigo-500/40 transition shadow-xs"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    {order.photoNumber && (
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${order.photoSource === 'whatsapp' || order.photoNumber.startsWith('WA_')
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : order.photoSource === 'scan' || order.photoNumber.startsWith('SCAN_')
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                              : order.photoSource === 'usb' || order.photoNumber.startsWith('USB_')
                                ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                                : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'
                          }`}
                      >
                        <span>
                          {order.photoSource === 'whatsapp' || order.photoNumber.startsWith('WA_')
                            ? '📱'
                            : order.photoSource === 'scan' || order.photoNumber.startsWith('SCAN_')
                              ? '🖼️'
                              : order.photoSource === 'usb'
                                ? '💾'
                                : '📸'}
                        </span>
                        <span>{order.photoNumber}</span>
                      </span>
                    )}
                    {order.photoshootId && (
                      <span className="font-mono text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
                        {order.photoshootId}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">Invoice: #{order.invoiceNumber}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Created: {order.createdAt}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      Due: {order.deliveryDue}
                    </span>
                  </div>
                </div>

                {/* Client & Service Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {order.clientName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {order.mobileNumber} &bull; <strong className="text-slate-800 dark:text-slate-200">{order.serviceTitle}</strong>
                    </p>
                    {order.photoCount.cameraPhotosTaken > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                        Camera Photos: {order.photoCount.cameraPhotosTaken} Taken &bull; {order.photoCount.clientSelected} Selected &bull; {order.photoCount.photosEdited} Edited
                      </p>
                    )}
                  </div>

                  {/* Pricing & Balance Badge */}
                  <div className="flex items-center gap-3 self-start md:self-auto">
                    <div className="text-right text-xs">
                      <span className="text-slate-400">Total: {formatCurrency(order.pricing.finalTotal)}</span>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {order.payment.balanceDue > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">Bal: {formatCurrency(order.payment.balanceDue)}</span>
                        ) : (
                          <span className="text-emerald-600">Paid in Full</span>
                        )}
                      </p>
                    </div>

                    {/* Quick Stage Dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${isCompleted
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : order.status === 'ready_for_delivery'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                            : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                        }`}
                    >
                      {ORDER_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.label}
                        </option>
                      ))}
                    </select>

                    {/* 1-Click Advance or Reopen Button */}
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(order.id, 'editing_in_progress')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-500/30"
                        title="Reopen order to active work"
                      >
                        <span>↩️ Reopen</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = currentStageIndex + 1;
                          if (nextIdx < ORDER_STAGES.length) {
                            updateOrderStatus(order.id, ORDER_STAGES[nextIdx].id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                        title="Move to next stage"
                      >
                        <span>Next &rarr;</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper Bar */}
                <div className="pt-1">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.round(((currentStageIndex + 1) / ORDER_STAGES.length) * 100)}%` }}
                      className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-semibold">
                    <span>Stage {currentStageIndex + 1} of 13: {ORDER_STAGES[currentStageIndex]?.label}</span>
                    <span>Last updated by: {order.updatedBy || 'Staff'}</span>
                  </div>
                </div>

                {/* Interactive Tick Mark Milestone Checklist (Pending / Done) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Workflow Milestones (Click any tick mark to mark Done / Pending):</span>
                    </span>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 w-fit">
                      {isCompleted ? '✅ All 6 Tasks Completed' : `⚡ ${ORDER_STAGES[currentStageIndex]?.label}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      {
                        label: '1. Shoot Taken',
                        icon: '📷',
                        doneStatus: 'photoshoot_completed',
                        isDone: currentStageIndex >= 1,
                        isActive: currentStageIndex === 1,
                      },
                      {
                        label: '2. Client Selected',
                        icon: '🎯',
                        doneStatus: 'photos_selected',
                        isDone: currentStageIndex >= 3,
                        isActive: currentStageIndex === 2 || currentStageIndex === 3,
                      },
                      {
                        label: '3. Editing Done',
                        icon: '🎨',
                        doneStatus: 'editing_completed',
                        isDone: currentStageIndex >= 6,
                        isActive: currentStageIndex === 4 || currentStageIndex === 5,
                      },
                      {
                        label: '4. Lab Printing',
                        icon: '🖨️',
                        doneStatus: 'production_in_progress',
                        isDone: currentStageIndex >= 9,
                        isActive: currentStageIndex === 8 || currentStageIndex === 9,
                      },
                      {
                        label: '5. Ready for Pickup',
                        icon: '🎁',
                        doneStatus: 'ready_for_delivery',
                        isDone: currentStageIndex >= 10,
                        isActive: currentStageIndex === 10,
                      },
                      {
                        label: '6. Delivered & Paid',
                        icon: '🤝',
                        doneStatus: 'completed',
                        isDone: currentStageIndex >= 11,
                        isActive: currentStageIndex === 11 || currentStageIndex === 12,
                      },
                    ].map((step, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (step.isDone) {
                            // toggle to previous stage if clicked
                            const prevStage = ORDER_STAGES[Math.max(0, currentStageIndex - 1)].id;
                            updateOrderStatus(order.id, prevStage);
                          } else {
                            // mark this step done
                            updateOrderStatus(order.id, step.doneStatus as OrderStatus);
                          }
                        }}
                        className={`flex flex-col items-start p-2 rounded-xl text-left border transition cursor-pointer ${step.isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                            : step.isActive
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                          }`}
                        title="Click to toggle Done / Pending"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs">{step.icon}</span>
                          {step.isDone ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1 rounded">
                              ✓ Done
                            </span>
                          ) : step.isActive ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-1 rounded animate-pulse">
                              ⚡ Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded">
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold mt-1.5 leading-tight truncate w-full">
                          {step.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-medium hidden sm:block mr-auto">
                    Created: {order.createdAt} &bull; Due: <strong className="text-slate-700 dark:text-slate-300">{order.deliveryDue}</strong>
                  </div>

                  <button
                    onClick={() => setSelectedOrderForEdit(order)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition cursor-pointer"
                    title="Edit Client Information, Line Items, Discounts or Advance Payment"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Bill</span>
                  </button>

                  <button
                    onClick={() => setSelectedOrderForWhatsAppImage(order)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition cursor-pointer"
                    title="Send Image Invoice on WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-800 hover:bg-amber-500 hover:text-slate-950 dark:text-amber-300 text-xs font-bold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Print Bill</span>
                  </button>

                  <button
                    onClick={() => handleDeleteOrderWithUndo(order)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Move to Recently Deleted (Recoverable)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invoice Edit Modal */}
      {selectedOrderForEdit && (
        <InvoiceEditModal
          order={selectedOrderForEdit}
          onClose={() => setSelectedOrderForEdit(null)}
          onSaved={() => setSelectedOrderForEdit(null)}
        />
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
            eventVenue: 'Lumina Studio & Color Lab',
            issueDate: selectedInvoiceOrder.createdAt,
            dueDate: selectedInvoiceOrder.deliveryDue,
            items: [
              {
                id: 'item-1',
                name: selectedInvoiceOrder.serviceTitle,
                description: `Photoshoot ID: ${selectedInvoiceOrder.photoshootId || 'N/A'} • Photographer: ${selectedInvoiceOrder.photographerName || 'Studio'}`,
                quantity: 1,
                rate: selectedInvoiceOrder.pricing.basePackagePrice,
                amount: selectedInvoiceOrder.pricing.basePackagePrice,
              },
              ...(selectedInvoiceOrder.pricing.extraPhotoTotal > 0
                ? [
                  {
                    id: 'item-2',
                    name: `Extra Selected Photos (${selectedInvoiceOrder.photoCount.extraSelected} photos @ ₹${selectedInvoiceOrder.photoCount.extraPhotoRate}/each)`,
                    quantity: selectedInvoiceOrder.photoCount.extraSelected,
                    rate: selectedInvoiceOrder.photoCount.extraPhotoRate,
                    amount: selectedInvoiceOrder.pricing.extraPhotoTotal,
                  },
                ]
                : []),
            ],
            subtotal: selectedInvoiceOrder.pricing.subtotal,
            discount: selectedInvoiceOrder.pricing.discount,
            discountType: 'flat',
            taxRate: 0,
            taxAmount: 0,
            total: selectedInvoiceOrder.pricing.finalTotal,
            paidAmount: selectedInvoiceOrder.payment.advancePaid,
            balanceDue: selectedInvoiceOrder.payment.balanceDue,
            status: selectedInvoiceOrder.payment.balanceDue === 0 ? 'paid' : 'partially_paid',
            createdAt: selectedInvoiceOrder.createdAt,
          }}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* WhatsApp Image Invoice Modal */}
      {selectedOrderForWhatsAppImage && (
        <WhatsAppImageInvoiceModal
          order={selectedOrderForWhatsAppImage}
          onClose={() => setSelectedOrderForWhatsAppImage(null)}
        />
      )}
    </div>
  );
};
