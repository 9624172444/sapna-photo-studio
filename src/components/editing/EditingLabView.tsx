import React, { useState } from 'react';
import { StudioOrder, OrderStatus, PhotoCountRecord } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { InvoicePrintModal } from '../billing/InvoicePrintModal';
import {
  Palette,
  Camera,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Search,
  Filter,
  User,
  Phone,
  FileImage,
  Layers,
  ArrowRight,
  Edit3,
  Check,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface EditingLabViewProps {
  onOpenCounterBooking?: () => void;
}

export const EditingLabView: React.FC<EditingLabViewProps> = ({ onOpenCounterBooking }) => {
  const {
    orders,
    updateOrderStatus,
    updateOrder,
    updatePhotoCount,
    formatCurrency,
    currentRole,
    resetToDemoData,
  } = useStudio();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'urgent' | 'pending' | 'in_progress' | 'ready_print' | 'completed'>('all');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<StudioOrder | null>(null);
  const [selectedOrderForNotes, setSelectedOrderForNotes] = useState<StudioOrder | null>(null);
  const [editorNoteInput, setEditorNoteInput] = useState('');

  // Orders that are relevant to Editing & Color Lab
  const activeEditingOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'completed');

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.clientName.toLowerCase().includes(q) ||
      order.mobileNumber.includes(q) ||
      order.orderNumber.toLowerCase().includes(q) ||
      (order.photoNumber && order.photoNumber.toLowerCase().includes(q)) ||
      (order.photoshootId && order.photoshootId.toLowerCase().includes(q)) ||
      order.serviceTitle.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterCategory === 'urgent') {
      return (
        order.serviceCategory === 'passport_visa' ||
        order.deliveryDue === new Date().toISOString().split('T')[0] ||
        order.status === 'editing_pending'
      );
    }
    if (filterCategory === 'pending') {
      return (
        order.status === 'editing_pending' ||
        order.status === 'photoshoot_completed' ||
        order.status === 'photos_selected' ||
        order.status === 'new_order'
      );
    }
    if (filterCategory === 'in_progress') {
      return order.status === 'editing_in_progress';
    }
    if (filterCategory === 'ready_print') {
      return (
        order.status === 'editing_completed' ||
        order.status === 'printing_pending' ||
        order.status === 'production_in_progress'
      );
    }
    if (filterCategory === 'completed') {
      return order.status === 'completed' || order.status === 'delivered' || order.status === 'ready_for_delivery';
    }
    return true;
  });

  const pendingCount = orders.filter(
    (o) => o.status === 'editing_pending' || o.status === 'new_order' || o.status === 'photos_selected'
  ).length;
  const inProgressCount = orders.filter((o) => o.status === 'editing_in_progress').length;
  const readyPrintCount = orders.filter(
    (o) => o.status === 'editing_completed' || o.status === 'printing_pending' || o.status === 'production_in_progress'
  ).length;
  const urgentCount = orders.filter(
    (o) =>
      o.serviceCategory === 'passport_visa' ||
      o.deliveryDue === new Date().toISOString().split('T')[0] ||
      o.status === 'editing_pending'
  ).length;

  const handleSaveEditorNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForNotes) return;

    updateOrder({
      ...selectedOrderForNotes,
      notes: editorNoteInput,
      updatedBy: `${currentRole.toUpperCase()} (Editor)`,
    });
    setSelectedOrderForNotes(null);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Editing & Color Lab Processing Queue
              </h1>
              <p className="text-xs text-slate-500">
                All client jobs ready for retouching, photo number matching & lab printing
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenCounterBooking && (
            <button
              onClick={onOpenCounterBooking}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Add Client Work</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Photo No (DSC_), Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setFilterCategory('urgent')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterCategory === 'urgent'
              ? 'bg-rose-500/15 border-rose-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span>⚡ Urgent / Today</span>
            <Zap className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {urgentCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Express passport & urgent prints</p>
        </div>

        <div
          onClick={() => setFilterCategory('pending')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterCategory === 'pending'
              ? 'bg-amber-500/15 border-amber-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span>⏳ Pending Editing</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting retouching</p>
        </div>

        <div
          onClick={() => setFilterCategory('in_progress')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterCategory === 'in_progress'
              ? 'bg-purple-500/15 border-purple-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
            <span>🎨 In Progress</span>
            <Edit3 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {inProgressCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Currently on editor desk</p>
        </div>

        <div
          onClick={() => setFilterCategory('ready_print')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            filterCategory === 'ready_print'
              ? 'bg-indigo-500/15 border-indigo-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>🖨️ Ready for Lab</span>
            <Printer className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {readyPrintCount}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Edited & ready for prints</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `All Client Work (${orders.length})` },
            { id: 'urgent', label: `⚡ Urgent / Passport (${urgentCount})` },
            { id: 'pending', label: `⏳ Pending (${pendingCount})` },
            { id: 'in_progress', label: `🎨 In Progress (${inProgressCount})` },
            { id: 'ready_print', label: `🖨️ Lab Printing (${readyPrintCount})` },
            { id: 'completed', label: `✅ Delivered / Done` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCategory(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === f.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={resetToDemoData}
          className="text-[11px] font-semibold text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
        >
          🔄 Reload Client Work
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-3">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No client work matching this filter</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Add a new client job from the counter or reload sample client orders.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              {onOpenCounterBooking && (
                <button
                  onClick={onOpenCounterBooking}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  + Add Client Work
                </button>
              )}
              <button
                onClick={resetToDemoData}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                🔄 Reset Sample Client Work
              </button>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isUrgent = order.serviceCategory === 'passport_visa' || order.deliveryDue === new Date().toISOString().split('T')[0];

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition shadow-xs space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-extrabold text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </span>

                    {/* PHOTO NUMBER / CAMERA FILE NO BADGE */}
                    {order.photoNumber ? (
                      <span className="font-mono text-xs font-extrabold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
                        <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>PHOTO NO: {order.photoNumber}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        Photo No: Not set
                      </span>
                    )}

                    {order.photoshootId && (
                      <span className="font-mono text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
                        {order.photoshootId}
                      </span>
                    )}

                    {isUrgent && (
                      <span className="text-[10px] font-extrabold uppercase bg-rose-500 text-white px-2 py-0.5 rounded-md animate-pulse">
                        ⚡ URGENT DELIVERY
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Billed: {order.createdAt}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      Due: {order.deliveryDue}
                    </span>
                  </div>
                </div>

                {/* Client, Specs & Photo Counts */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Client & Service */}
                  <div className="md:col-span-4 space-y-1">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {order.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-500" />
                      <span>{order.mobileNumber}</span>
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {order.serviceTitle}
                    </p>
                    {order.passportSpecs && (
                      <p className="text-[11px] text-slate-500">
                        {order.passportSpecs.photoSize} &bull; {order.passportSpecs.backgroundColor} Background &bull; {order.passportSpecs.quantity} Prints
                      </p>
                    )}
                    {order.babySpecs && (
                      <p className="text-[11px] text-slate-500">
                        Baby: <strong>{order.babySpecs.babyName}</strong> ({order.babySpecs.babyAge}) &bull; {order.babySpecs.packageType.toUpperCase()} Package
                      </p>
                    )}
                    {order.mobilePrintSpecs && (
                      <p className="text-[11px] text-slate-500">
                        {order.mobilePrintSpecs.printSize} &bull; {order.mobilePrintSpecs.frameType}
                      </p>
                    )}
                  </div>

                  {/* Camera Photo Count Details */}
                  <div className="md:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Camera Photo Counts:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Taken</span>
                        <strong className="text-slate-900 dark:text-white font-extrabold">{order.photoCount.cameraPhotosTaken}</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Selected</span>
                        <strong className="text-emerald-600 font-extrabold">{order.photoCount.clientSelected}</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">Edited</span>
                        <strong className="text-purple-600 font-extrabold">{order.photoCount.photosEdited}</strong>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                        <strong>Note:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* 1-Click Status Action Buttons */}
                  <div className="md:col-span-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-semibold">Current State:</span>
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Quick Step Advance Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {order.status !== 'editing_in_progress' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'editing_in_progress', `${currentRole.toUpperCase()} (Editor)`)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Start Editing</span>
                        </button>
                      )}

                      {order.status === 'editing_in_progress' && (
                        <button
                          onClick={() => {
                            updateOrderStatus(order.id, 'editing_completed', `${currentRole.toUpperCase()} (Editor)`);
                            updatePhotoCount(order.id, {
                              ...order.photoCount,
                              photosEdited: order.photoCount.clientSelected,
                            });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finish Editing</span>
                        </button>
                      )}

                      <button
                        onClick={() => updateOrderStatus(order.id, 'printing_pending', `${currentRole.toUpperCase()} (Editor)`)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                        title="Send to Lab Printing"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Send to Lab</span>
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready_for_delivery', `${currentRole.toUpperCase()} (Editor)`)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
                        title="Ready for Pickup"
                      >
                        <span>🎁 Ready</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedOrderForNotes(order);
                          setEditorNoteInput(order.notes || '');
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        + Add Editor Note
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                      >
                        View Bill
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Note Modal */}
      {selectedOrderForNotes && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm">Editor Notes & Instructions</h3>
              </div>
              <button onClick={() => setSelectedOrderForNotes(null)} className="p-1 rounded text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditorNote} className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedOrderForNotes.clientName} &bull; Order #{selectedOrderForNotes.orderNumber}
                </p>
                {selectedOrderForNotes.photoNumber && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-mono font-bold">
                    Photo No: {selectedOrderForNotes.photoNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Retouching / Lab Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Skin smoothing done, background cleaned, passport 12 copies printed on glossy paper..."
                  value={editorNoteInput}
                  onChange={(e) => setEditorNoteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForNotes(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Preview */}
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
                description: `Photo No: ${selectedInvoiceOrder.photoNumber || 'N/A'} • Photoshoot ID: ${selectedInvoiceOrder.photoshootId || 'N/A'}`,
                quantity: 1,
                rate: selectedInvoiceOrder.pricing.basePackagePrice,
                amount: selectedInvoiceOrder.pricing.basePackagePrice,
              },
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
    </div>
  );
};
