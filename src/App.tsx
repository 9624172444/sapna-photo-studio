import React, { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { Navbar } from './components/common/Navbar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { NotificationReminderCenter } from './components/notifications/NotificationReminderCenter';
import { DashboardView } from './components/dashboard/DashboardView';
import { CounterBookingModal } from './components/counter/CounterBookingModal';
import { PhotoshootView } from './components/photoshoot/PhotoshootView';
import { OrdersView } from './components/orders/OrdersView';
import { ReadyOrdersView } from './components/orders/ReadyOrdersView';
import { PendingPaymentsView } from './components/payments/PendingPaymentsView';
import { PriceMasterView } from './components/masters/PriceMasterView';
import { FrameMasterView } from './components/masters/FrameMasterView';
import { PrintOnlyMasterView } from './components/masters/PrintOnlyMasterView';
import { BillingView } from './components/billing/BillingView';
import { PaymentsView } from './components/payments/PaymentsView';
import { CustomerCRMView } from './components/clients/CustomerCRMView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { StudioOrder } from './types';

const MainApp: React.FC = () => {
  const { activeTab, setActiveTab } = useStudio();
  const [isCounterBookingOpen, setIsCounterBookingOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const handleOrderCreated = (newOrder: StudioOrder) => {
    setActiveTab('orders_workflow');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-[#0c0e14] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onOpenCounterBooking={() => setIsCounterBookingOpen(true)}
        onOpenNewInvoice={() => setIsCounterBookingOpen(true)}
        onOpenRecordPayment={() => setActiveTab('pending_payments')}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      />

      {/* Main Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 lg:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenCounterBooking={() => setIsCounterBookingOpen(true)}
            onOpenNewInvoice={() => setIsCounterBookingOpen(true)}
            onOpenRecordPayment={() => setActiveTab('pending_payments')}
          />
        )}

        {activeTab === 'photoshoots' && <PhotoshootView />}

        {activeTab === 'orders_workflow' && <OrdersView />}

        {activeTab === 'ready_orders' && <ReadyOrdersView />}

        {activeTab === 'pending_payments' && <PendingPaymentsView />}

        {activeTab === 'price_master' && <PriceMasterView />}

        {activeTab === 'frame_master' && <FrameMasterView />}

        {activeTab === 'print_master' && <PrintOnlyMasterView />}

        {activeTab === 'billing' && (
          <BillingView onOpenRecordPayment={() => setActiveTab('pending_payments')} />
        )}

        {activeTab === 'payments' && <PaymentsView />}

        {activeTab === 'customers' && <CustomerCRMView />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile Floating Bottom Bar for Thumb Navigation */}
      <MobileBottomNav onOpenCounterBooking={() => setIsCounterBookingOpen(true)} />

      {/* Studio Notification & Reminder Center Drawer */}
      <NotificationReminderCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      {/* Counter Booking Assistant Modal */}
      {isCounterBookingOpen && (
        <CounterBookingModal
          onClose={() => setIsCounterBookingOpen(false)}
          onOrderCreated={handleOrderCreated}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <MainApp />
    </StudioProvider>
  );
}
