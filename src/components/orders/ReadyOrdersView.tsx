import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { StudioOrder } from '../../types';
import { InvoicePrintModal } from '../billing/InvoicePrintModal';
import {
  Gift,
  Search,
  CheckCircle2,
  Phone,
  MessageSquare,
  Printer,
  CreditCard,
  Camera,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  RotateCcw,
  Truck,
  Layers,
  ChevronRight,
  Send,
} from 'lucide-react';

export const ReadyOrdersView: React.FC = () => {
  const { orders, updateOrderStatus, recordOrderPayment, formatCurrency, profile } = useStudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'ready' | 'in_production' | 'delivered' | 'all'>('ready');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<StudioOrder | null>(null);

  // Delivery & Payment Collection Modal State
  const [deliveringOrder, setDeliveringOrder] = useState<StudioOrder | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [collectionMode, setCollectionMode] = useState<'cash' | 'upi' | 'split'>('cash');
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitOnline, setSplitOnline] = useState<number>(0);
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');

  // Categorize Orders
  const readyOrders = orders.filter((o) => o.status === 'ready_for_delivery');
  const inProductionOrders = orders.filter(
    (o) =>
      o.status !== 'ready_for_delivery' &&
      o.status !== 'delivered' &&
      o.status !== 'completed'
  );
  const deliveredOrders = orders.filter(
    (o) => o.status === 'delivered' || o.status === 'completed'
  );

  // Select list based on active sub tab
  const getOrdersForCurrentTab = () => {
    switch (activeSubTab) {
      case 'ready':
        return readyOrders;
      case 'in_production':
        return inProductionOrders;
      case 'delivered':
        return deliveredOrders;
      case 'all':
      default:
        return orders;
    }
  };

  const currentTabOrders = getOrdersForCurrentTab();

  const filteredOrders = currentTabOrders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.clientName.toLowerCase().includes(q) ||
      o.mobileNumber.includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.photoNumber && o.photoNumber.toLowerCase().includes(q)) ||
      o.serviceTitle.toLowerCase().includes(q)
    );
  });

  const handleOpenDeliveryModal = (order: StudioOrder) => {
    setDeliveringOrder(order);
    const due = order.payment.balanceDue || 0;
    setCollectionAmount(due);
    setSplitCash(Math.round(due / 2));
    setSplitOnline(due - Math.round(due / 2));
    setCollectionMode('cash');
  };

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringOrder) return;

    if (collectionAmount > 0) {
      recordOrderPayment(
        deliveringOrder.id,
        collectionAmount,
        collectionMode,
        collectionMode === 'upi' ? selectedUpiApp : undefined,
        `DELIVERY-COLLECT-${Date.now()}`
      );
    }

    updateOrderStatus(deliveringOrder.id, 'delivered');
    setDeliveringOrder(null);
  };

  const handleMarkAsReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready_for_delivery');
  };

  const handleMarkAsDeliveredDirectly = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
  };

  const handleShareWhatsApp = (order: StudioOrder) => {
    const text = `*Sapna Photoshop — Order Ready for Pickup!*\n\nHello ${order.clientName}!\nYour order *#${order.orderNumber}* (${order.serviceTitle}) is finished, framed & packaged.\n\n• *Total Amount:* ${formatCurrency(order.pricing.finalTotal)}\n• *Balance Due:* ${formatCurrency(order.payment.balanceDue)}\n\nPlease visit our counter to collect your prints. Thank you!\n📍 *Sapna Photoshop, Mansa*`;
    const phone = (order.whatsappNumber || order.mobileNumber).replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getSourceIcon = (order: StudioOrder) => {
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
      {/* 1. Header & Navigation Hub */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Ready for Delivery & Pickup Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Finished prints, frames & albums ready for customer pickup, balance settlement & delivery
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, order #, photo #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-inner"
          />
        </div>
      </div>

      {/* 2. Sub-Tabs Filter Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('ready')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'ready'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 Ready for Pickup</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'ready' ? 'bg-white text-emerald-700' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {readyOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('in_production')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'in_production'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏳ In Production (Move to Ready)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'in_production' ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              {inProductionOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('delivered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'delivered'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>🚚 Delivered & Completed</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeSubTab === 'delivered' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {deliveredOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <span>All ({orders.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          Counter Delivery Workflow
        </div>
      </div>

      {/* 3. Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              {activeSubTab === 'ready'
                ? 'No Orders Waiting in Ready Queue'
                : 'No Orders Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {activeSubTab === 'ready'
                ? 'All finished prints and frames have been delivered! You can check in-production orders and mark them as ready below.'
                : 'No orders match your search criteria.'}
            </p>
          </div>

          {activeSubTab === 'ready' && inProductionOrders.length > 0 && (
            <button
              onClick={() => setActiveSubTab('in_production')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <span>View {inProductionOrders.length} In-Production Orders & Mark Ready</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const src = getSourceIcon(order);
            const isReady = order.status === 'ready_for_delivery';
            const isDelivered = order.status === 'delivered' || order.status === 'completed';

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between gap-4 ${
                  isReady
                    ? 'border-2 border-emerald-500/50 hover:border-emerald-500 shadow-emerald-500/5'
                    : isDelivered
                    ? 'border-slate-200 dark:border-slate-800 opacity-90'
                    : 'border-2 border-indigo-500/30 hover:border-indigo-500/60'
                }`}
              >
                {/* Top Card Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md">
                        #{order.orderNumber}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[10px] font-bold ${src.color}`}>
                        <span>{src.icon}</span>
                        <span>{order.photoNumber || src.label}</span>
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isReady
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : isDelivered
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {isReady && <Sparkles className="w-3 h-3 text-emerald-500" />}
                      <span>{order.status.replace(/_/g, ' ')}</span>
                    </span>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {order.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{order.mobileNumber}</span>
                    </p>
                    <div className="mt-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {order.serviceTitle}
                      </span>
                      {order.notes && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Note: {order.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Total & Balance */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Bill</span>
                      <strong className="text-slate-900 dark:text-white font-black text-sm">
                        {formatCurrency(order.pricing.finalTotal)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Balance to Collect</span>
                      {order.payment.balanceDue > 0 ? (
                        <strong className="text-rose-600 dark:text-rose-400 font-black text-sm">
                          {formatCurrency(order.payment.balanceDue)}
                        </strong>
                      ) : (
                        <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          ✓ Fully Paid
                        </strong>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isReady ? (
                    <button
                      onClick={() => handleOpenDeliveryModal(order)}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-md shadow-emerald-500/25 active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🤝 Handover & Complete Delivery</span>
                    </button>
                  ) : !isDelivered ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleMarkAsReady(order.id)}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>⚡ Mark Ready</span>
                      </button>
                      <button
                        onClick={() => handleOpenDeliveryModal(order)}
                        className="flex items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Deliver Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Order Delivered to Customer</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleShareWhatsApp(order)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>WhatsApp Alert</span>
                    </button>

                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Print Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Delivery Handover & Balance Collection Modal (With Split Payment Support) */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Confirm Delivery Handover
                </h3>
              </div>
              <button
                onClick={() => setDeliveringOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                {deliveringOrder.clientName}
              </p>
              <p className="text-slate-500">{deliveringOrder.serviceTitle}</p>
              <p className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Order #{deliveringOrder.orderNumber}
              </p>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              {deliveringOrder.payment.balanceDue > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Balance Pending:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      {formatCurrency(deliveringOrder.payment.balanceDue)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Collect Payment Now (₹)
                    </label>
                    <input
                      type="number"
                      value={collectionAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCollectionAmount(val);
                        setSplitCash(Math.round(val / 2));
                        setSplitOnline(val - Math.round(val / 2));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-500 text-base font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Payment Mode Selector: Cash / UPI / Split */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setCollectionMode('cash')}
                        className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          collectionMode === 'cash'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        💵 Cash
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollectionMode('upi')}
                        className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          collectionMode === 'upi'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        📱 UPI
                      </button>

                      <button
                        type="button"
                        onClick={() => setCollectionMode('split')}
                        className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          collectionMode === 'split'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        ⚡ Split
                      </button>
                    </div>
                  </div>

                  {/* Split Breakdown Details if Split Mode */}
                  {collectionMode === 'split' && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                            💵 Cash (₹)
                          </label>
                          <input
                            type="number"
                            value={splitCash}
                            onChange={(e) => {
                              const cash = Number(e.target.value);
                              setSplitCash(cash);
                              setSplitOnline(Math.max(0, collectionAmount - cash));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                            📱 Online UPI (₹)
                          </label>
                          <input
                            type="number"
                            value={splitOnline}
                            onChange={(e) => {
                              const upi = Number(e.target.value);
                              setSplitOnline(upi);
                              setSplitCash(Math.max(0, collectionAmount - upi));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Order is 100% Paid in Full. No balance remaining to collect!</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="w-1/2 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Confirm Delivered ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
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
