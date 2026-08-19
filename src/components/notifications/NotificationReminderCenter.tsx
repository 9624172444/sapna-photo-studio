import React, { useState } from 'react';
import { useStudio, ActiveTab } from '../../context/StudioContext';
import { StudioOrder } from '../../types';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Printer,
  Gift,
  CreditCard,
  MessageSquare,
  ChevronRight,
  Send,
  Phone,
  CheckCircle2,
  Sparkles,
  Flame,
  Volume2,
  Filter,
} from 'lucide-react';

interface NotificationReminderCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ReminderType = 'overdue' | 'due_today' | 'editing' | 'printing' | 'selection' | 'unpaid' | 'ready_pickup';

export interface StudioReminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  order: StudioOrder;
  dueDate: string;
  badge: string;
  badgeColor: string;
  actionTab: ActiveTab;
}

export const NotificationReminderCenter: React.FC<NotificationReminderCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { orders, setActiveTab, formatCurrency, profile } = useStudio();
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'production' | 'payment'>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Generate Reminders Dynamically from Orders
  const reminders: StudioReminder[] = [];

  orders.forEach((o) => {
    const isCompleted = o.status === 'completed' || o.status === 'delivered';
    const isDueToday = o.deliveryDue === todayStr;
    const isOverdue = o.deliveryDue < todayStr && !isCompleted;

    // A. Overdue Deliveries (HIGHEST PRIORITY)
    if (isOverdue) {
      reminders.push({
        id: `overdue-${o.id}`,
        type: 'overdue',
        title: `🚨 Overdue Delivery: ${o.clientName}`,
        description: `${o.serviceTitle} was promised for delivery on ${o.deliveryDue}. Current status: ${o.status.replace(/_/g, ' ').toUpperCase()}.`,
        priority: 'high',
        order: o,
        dueDate: o.deliveryDue,
        badge: 'OVERDUE',
        badgeColor: 'bg-rose-500 text-white animate-pulse',
        actionTab: 'orders_workflow',
      });
    }

    // B. Due Today Deliveries
    else if (isDueToday && !isCompleted) {
      reminders.push({
        id: `duetoday-${o.id}`,
        type: 'due_today',
        title: `⏰ Due Today: ${o.clientName}`,
        description: `${o.serviceTitle} is scheduled for customer delivery TODAY (${o.deliveryDue}).`,
        priority: 'high',
        order: o,
        dueDate: o.deliveryDue,
        badge: 'DUE TODAY',
        badgeColor: 'bg-amber-500 text-slate-950 font-black',
        actionTab: 'orders_workflow',
      });
    }

    // C. Pending Editing Work
    if (o.status === 'editing_pending' || o.status === 'editing_in_progress') {
      reminders.push({
        id: `editing-${o.id}`,
        type: 'editing',
        title: `🎨 Photoshop Editing Pending: ${o.clientName}`,
        description: `Photo #${o.photoNumber || 'N/A'} requires editing & retouching for ${o.serviceTitle}.`,
        priority: o.isUrgent ? 'high' : 'medium',
        order: o,
        dueDate: o.deliveryDue,
        badge: o.isUrgent ? 'URGENT EDIT' : 'EDITING QUEUE',
        badgeColor: o.isUrgent ? 'bg-rose-600 text-white' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30',
        actionTab: 'orders_workflow',
      });
    }

    // D. Pending Lab Printing & Framing
    if (o.status === 'printing_pending' || o.status === 'production_in_progress') {
      reminders.push({
        id: `printing-${o.id}`,
        type: 'printing',
        title: `🖨️ Lab Printing / Framing Pending: ${o.clientName}`,
        description: `Prints & frame assembly pending for ${o.serviceTitle}.`,
        priority: 'medium',
        order: o,
        dueDate: o.deliveryDue,
        badge: 'PRINT PRODUCTION',
        badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
        actionTab: 'orders_workflow',
      });
    }

    // E. Photo Selection Pending from Client
    if (o.status === 'photo_selection_pending') {
      reminders.push({
        id: `selection-${o.id}`,
        type: 'selection',
        title: `📸 Photo Selection Pending: ${o.clientName}`,
        description: `Photoshoot completed on ${o.photoshootDate || o.createdAt}. Waiting for client to select final photos.`,
        priority: 'medium',
        order: o,
        dueDate: o.deliveryDue,
        badge: 'SELECT PHOTOS',
        badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
        actionTab: 'photoshoots',
      });
    }

    // F. Ready for Pickup (Pending Handover)
    if (o.status === 'ready_for_delivery') {
      reminders.push({
        id: `ready-${o.id}`,
        type: 'ready_pickup',
        title: `🎁 Ready for Counter Pickup: ${o.clientName}`,
        description: `Packaged & waiting at studio counter. Balance to collect: ${formatCurrency(o.payment.balanceDue)}.`,
        priority: 'medium',
        order: o,
        dueDate: o.deliveryDue,
        badge: 'READY FOR PICKUP',
        badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
        actionTab: 'ready_orders',
      });
    }

    // G. Pending Balances / Payment Dues
    if (o.payment.balanceDue > 0 && isCompleted) {
      reminders.push({
        id: `unpaid-${o.id}`,
        type: 'unpaid',
        title: `💰 Pending Payment Due: ${o.clientName}`,
        description: `Delivered order #${o.orderNumber} has outstanding balance of ${formatCurrency(o.payment.balanceDue)}.`,
        priority: 'medium',
        order: o,
        dueDate: o.deliveryDue,
        badge: `₹${o.payment.balanceDue} DUE`,
        badgeColor: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
        actionTab: 'pending_payments',
      });
    }
  });

  // Filter out dismissed items
  const activeReminders = reminders.filter((r) => !dismissedIds.includes(r.id));

  // Sub-filter by category
  const filteredReminders = activeReminders.filter((r) => {
    if (filterType === 'all') return true;
    if (filterType === 'urgent') return r.type === 'overdue' || r.type === 'due_today' || r.priority === 'high';
    if (filterType === 'production') return r.type === 'editing' || r.type === 'printing' || r.type === 'selection';
    if (filterType === 'payment') return r.type === 'unpaid' || r.order.payment.balanceDue > 0;
    return true;
  });

  const handleSendWhatsAppReminder = (r: StudioReminder) => {
    let message = '';
    const phone = (r.order.whatsappNumber || r.order.mobileNumber).replace(/[^0-9]/g, '');

    if (r.type === 'selection') {
      message = `Hello ${r.order.clientName}!\nFriendly reminder from *${profile.name}, Mansa*:\nYour photoshoot preview is ready for photo selection. Kindly visit our studio or let us know your chosen photo numbers so we can begin retouching & printing.\n\nThank you!`;
    } else if (r.type === 'ready_pickup') {
      message = `*Sapna Photoshop — Order Ready for Pickup!*\n\nHello ${r.order.clientName}!\nYour order *#${r.order.orderNumber}* (${r.order.serviceTitle}) is finished, framed & packaged.\n• *Balance Due:* ${formatCurrency(r.order.payment.balanceDue)}\n\nPlease visit our counter in Mansa to collect your prints. Thank you!`;
    } else if (r.type === 'unpaid' || r.order.payment.balanceDue > 0) {
      message = `*Payment Reminder from ${profile.name}*\n\nHello ${r.order.clientName}!\nThis is a friendly reminder regarding pending balance of *${formatCurrency(r.order.payment.balanceDue)}* for order *#${r.order.orderNumber}* (${r.order.serviceTitle}).\nUPI ID: ${profile.upiId}\n\nThank you!`;
    } else {
      message = `Hello ${r.order.clientName}! Quick update from ${profile.name} regarding your order *#${r.order.orderNumber}* (${r.order.serviceTitle}). Delivery date: ${r.order.deliveryDue}. We are working on finishing your prints! Thank you.`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleJumpToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  Studio Reminder Center
                </h2>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  {activeReminders.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Pending tasks, due dates, editing queue & payment follow-ups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: `All (${activeReminders.length})` },
            { id: 'urgent', label: `🚨 Urgent / Overdue (${activeReminders.filter((r) => r.type === 'overdue' || r.type === 'due_today').length})` },
            { id: 'production', label: `🎨 Production (${activeReminders.filter((r) => r.type === 'editing' || r.type === 'printing' || r.type === 'selection').length})` },
            { id: 'payment', label: `💰 Dues (${activeReminders.filter((r) => r.order.payment.balanceDue > 0).length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Reminders List Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {filteredReminders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                All Reminders Cleared!
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                There are no pending task alerts or overdue deliveries in this category.
              </p>
            </div>
          ) : (
            filteredReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-2xl border transition shadow-xs space-y-2.5 ${
                  reminder.priority === 'high'
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Header: Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-1 ${reminder.badgeColor}`}>
                      {reminder.badge}
                    </span>
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                      {reminder.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => handleDismiss(reminder.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {reminder.description}
                </p>

                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: <strong>{reminder.dueDate}</strong></span>
                  </div>

                  {reminder.order.payment.balanceDue > 0 && (
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      Balance: {formatCurrency(reminder.order.payment.balanceDue)}
                    </span>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSendWhatsAppReminder(reminder)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Reminder</span>
                  </button>

                  <button
                    onClick={() => handleJumpToTab(reminder.actionTab)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-extrabold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Open Work</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>{activeReminders.length} active alerts in studio</span>
          <button
            onClick={() => handleJumpToTab('orders_workflow')}
            className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            View Full Workflow &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
