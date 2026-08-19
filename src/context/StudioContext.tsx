import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  StudioProfile,
  CustomerProfile,
  StudioOrder,
  Employee,
  EmployeeRole,
  OrderStatus,
  PaymentMode,
  PaymentStatus,
  UpiApp,
  PhotoCountRecord,
  ServiceItemConfig,
  ServicePackage,
  FramePriceConfig,
  LaminationOptionConfig,
  PrintOnlyPriceConfig,
  DeletedOrder,
} from '../types';
import {
  INITIAL_STUDIO_PROFILE,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_SERVICES,
  INITIAL_EMPLOYEES,
  INITIAL_PACKAGES,
  INITIAL_FRAME_PRICES,
  INITIAL_LAMINATION_OPTIONS,
  INITIAL_PRINT_ONLY_PRICES,
} from '../data/initialData';
import {
  WhatsAppGatewayConfig,
  DEFAULT_WHATSAPP_CONFIG,
  sendWhatsAppMessage,
  buildInvoiceWhatsAppText,
  WhatsAppSendResult,
} from '../services/whatsappService';

export type ActiveTab =
  | 'dashboard'
  | 'counter_pos'
  | 'photoshoots'
  | 'orders_workflow'
  | 'ready_orders'
  | 'pending_payments'
  | 'price_master'
  | 'frame_master'
  | 'print_master'
  | 'billing'
  | 'payments'
  | 'customers'
  | 'reports'
  | 'settings';

interface DailyStats {
  todayCustomers: number;
  todayOrders: number;
  todayRevenue: number;
  todayCash: number;
  todayUPI: number;
  totalPendingPayments: number;
  pendingEditingCount: number;
  readyForDeliveryCount: number;
  completedOrdersCount: number;
}

export interface WhatsAppNotificationLog {
  id: string;
  orderNumber: string;
  clientName: string;
  phone: string;
  status: 'sent' | 'delivered';
  timestamp: string;
}

interface StudioContextType {
  profile: StudioProfile;
  orders: StudioOrder[];
  customers: CustomerProfile[];
  services: ServiceItemConfig[];
  packages: ServicePackage[];
  framePrices: FramePriceConfig[];
  laminationOptions: LaminationOptionConfig[];
  printOnlyPrices: PrintOnlyPriceConfig[];
  employees: Employee[];
  currentRole: EmployeeRole;
  setCurrentRole: (role: EmployeeRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;

  // WhatsApp Background Gateway
  whatsAppConfig: WhatsAppGatewayConfig;
  updateWhatsAppConfig: (config: WhatsAppGatewayConfig) => void;
  whatsAppLogs: WhatsAppNotificationLog[];
  sendInvoiceWhatsAppBackground: (order: StudioOrder) => Promise<WhatsAppSendResult>;

  // Order Actions & Trash / Recycle Recovery
  deletedOrders: DeletedOrder[];
  createOrder: (orderData: Omit<StudioOrder, 'id' | 'orderNumber' | 'invoiceNumber' | 'createdAt'>) => StudioOrder;
  updateOrder: (order: StudioOrder) => void;
  deleteOrder: (id: string, reason?: string) => void;
  restoreOrder: (id: string) => void;
  permanentlyDeleteOrder: (id: string) => void;
  emptyTrash: () => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, updatedBy?: string) => void;
  updatePhotoCount: (orderId: string, photoCount: PhotoCountRecord, updatedBy?: string) => void;
  recordOrderPayment: (
    orderId: string,
    amount: number,
    mode: PaymentMode,
    upiApp?: UpiApp,
    ref?: string,
    updatedBy?: string
  ) => void;

  // Customer Actions
  findCustomerByMobile: (mobile: string) => { customer?: CustomerProfile; orderHistory: StudioOrder[] };
  addOrUpdateCustomer: (customer: Omit<CustomerProfile, 'id' | 'totalVisits' | 'totalOrders' | 'totalSpent' | 'pendingBalance' | 'firstVisitDate' | 'lastVisitDate'>) => CustomerProfile;

  // Masters & Configs
  addPackage: (pkg: Omit<ServicePackage, 'id'>) => void;
  updatePackage: (pkg: ServicePackage) => void;
  deletePackage: (id: string) => void;

  addFramePrice: (frame: Omit<FramePriceConfig, 'id'>) => void;
  updateFramePrice: (frame: FramePriceConfig) => void;
  deleteFramePrice: (id: string) => void;

  updateLaminationOption: (lam: LaminationOptionConfig) => void;

  addPrintOnlyPrice: (print: Omit<PrintOnlyPriceConfig, 'id'>) => void;
  updatePrintOnlyPrice: (print: PrintOnlyPriceConfig) => void;
  deletePrintOnlyPrice: (id: string) => void;

  // Services & Profile
  addService: (service: Omit<ServiceItemConfig, 'id'>) => void;
  updateService: (service: ServiceItemConfig) => void;
  deleteService: (id: string) => void;
  updateProfile: (profile: StudioProfile) => void;

  // Stats & Helpers
  getDailyStats: () => DailyStats;
  formatCurrency: (amount: number) => string;
  resetToDemoData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => boolean;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'studioerp_profile_v4',
  ORDERS: 'studioerp_orders_v4',
  CUSTOMERS: 'studioerp_customers_v4',
  SERVICES: 'studioerp_services_v4',
  ROLE: 'studioerp_role_v4',
  DARK_MODE: 'studioerp_darkmode_v4',
  WA_CONFIG: 'studioerp_wa_config_v4',
};

function loadStoredData<T>(keys: string[], fallback: T): T {
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0) return parsed as unknown as T;
        } else if (parsed && typeof parsed === 'object') {
          return parsed as T;
        }
      }
    } catch (e) {
      console.warn(`Failed to parse localStorage key: ${key}`, e);
    }
  }
  return fallback;
}

function loadProfile(): StudioProfile {
  const keys = ['studioerp_profile_v5', 'studioerp_profile_v4', 'studioerp_profile_v3', 'studioerp_profile_v2', 'studioerp_profile'];
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_STUDIO_PROFILE,
            ...parsed,
            name: parsed.name && parsed.name !== 'Lumina Photo Studio & Color Lab' ? parsed.name : 'Sapna Photo Studio',
            upiId: parsed.upiId || '9879822507@okbizaxis',
            phone: parsed.phone || '+91 98798 22507',
            whatsapp: parsed.whatsapp || '+91 98798 22507',
            googleReviewUrl: parsed.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review',
            logoUrl: parsed.logoUrl || '/sapna_logo.png',
          };
        }
      }
    } catch (e) {}
  }
  return INITIAL_STUDIO_PROFILE;
}

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudioProfile>(() => {
    return loadProfile();
  });

  const [orders, setOrders] = useState<StudioOrder[]>(() => {
    const loaded = loadStoredData<StudioOrder[]>(
      ['studioerp_orders_v4', 'studioerp_orders_v3', 'studioerp_orders_v2', 'studioerp_orders_v1', 'studioerp_orders'],
      INITIAL_ORDERS
    );
    return loaded && loaded.length > 0 ? loaded : INITIAL_ORDERS;
  });

  const [deletedOrders, setDeletedOrders] = useState<DeletedOrder[]>(() => {
    return loadStoredData<DeletedOrder[]>(['studioerp_deleted_orders_v1'], []);
  });

  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    const loaded = loadStoredData<CustomerProfile[]>(
      ['studioerp_customers_v4', 'studioerp_customers_v3', 'studioerp_customers_v2', 'studioerp_customers_v1', 'studioerp_customers'],
      INITIAL_CUSTOMERS
    );
    return loaded && loaded.length > 0 ? loaded : INITIAL_CUSTOMERS;
  });

  const [services, setServices] = useState<ServiceItemConfig[]>(() => {
    return loadStoredData(
      ['studioerp_services_v4', 'studioerp_services_v3', 'studioerp_services_v2', 'studioerp_services_v1', 'studioerp_services'],
      INITIAL_SERVICES
    );
  });

  const [packages, setPackages] = useState<ServicePackage[]>(() => {
    return loadStoredData(
      ['studioerp_packages_v4', 'studioerp_packages_v1', 'studioerp_packages'],
      INITIAL_PACKAGES
    );
  });

  const [framePrices, setFramePrices] = useState<FramePriceConfig[]>(() => {
    return loadStoredData(
      ['studioerp_frame_prices_v4', 'studioerp_frame_prices_v1', 'studioerp_frame_prices'],
      INITIAL_FRAME_PRICES
    );
  });

  const [laminationOptions, setLaminationOptions] = useState<LaminationOptionConfig[]>(() => {
    return loadStoredData(
      ['studioerp_lamination_options_v4', 'studioerp_lamination_options_v1', 'studioerp_lamination_options'],
      INITIAL_LAMINATION_OPTIONS
    );
  });

  const [printOnlyPrices, setPrintOnlyPrices] = useState<PrintOnlyPriceConfig[]>(() => {
    return loadStoredData(
      ['studioerp_print_prices_v4', 'studioerp_print_prices_v1', 'studioerp_print_prices'],
      INITIAL_PRINT_ONLY_PRICES
    );
  });

  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppGatewayConfig>(() => {
    return loadStoredData(
      ['studioerp_wa_config_v4', 'studioerp_wa_config_v3', 'studioerp_wa_config_v2', 'studioerp_wa_config_v1', 'studioerp_wa_config'],
      DEFAULT_WHATSAPP_CONFIG
    );
  });

  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppNotificationLog[]>([]);

  const [currentRole, setCurrentRole] = useState<EmployeeRole>(() => {
    const saved = localStorage.getItem('studioerp_role_v4') || localStorage.getItem('studioerp_role_v2');
    return (saved as EmployeeRole) || 'counter_sales';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studioerp_darkmode_v4') || localStorage.getItem('studioerp_darkmode_v2');
    return saved ? JSON.parse(saved) : true;
  });

  // LocalStorage syncing & Multi-Tab Broadcast
  const broadcastSync = () => {
    try {
      const channel = new BroadcastChannel('studio_sync_channel');
      channel.postMessage({ type: 'SYNC_ALL', timestamp: Date.now() });
      channel.close();
    } catch (e) {}
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    broadcastSync();
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    broadcastSync();
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    broadcastSync();
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    broadcastSync();
  }, [services]);

  useEffect(() => {
    localStorage.setItem('studioerp_packages_v4', JSON.stringify(packages));
    broadcastSync();
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('studioerp_frame_prices_v4', JSON.stringify(framePrices));
    broadcastSync();
  }, [framePrices]);

  useEffect(() => {
    localStorage.setItem('studioerp_lamination_options_v4', JSON.stringify(laminationOptions));
    broadcastSync();
  }, [laminationOptions]);

  useEffect(() => {
    localStorage.setItem('studioerp_print_prices_v4', JSON.stringify(printOnlyPrices));
    broadcastSync();
  }, [printOnlyPrices]);

  useEffect(() => {
    localStorage.setItem('studioerp_deleted_orders_v1', JSON.stringify(deletedOrders));
    broadcastSync();
  }, [deletedOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WA_CONFIG, JSON.stringify(whatsAppConfig));
    broadcastSync();
  }, [whatsAppConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Real-Time Cross-Tab Live Sync Listener
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('studio_sync_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_ALL') {
          const ords = loadStoredData<StudioOrder[]>(['studioerp_orders_v4'], orders);
          const dels = loadStoredData<DeletedOrder[]>(['studioerp_deleted_orders_v1'], deletedOrders);
          const prof = loadProfile();
          const custs = loadStoredData<CustomerProfile[]>(['studioerp_customers_v4'], customers);
          
          if (ords) setOrders(ords);
          if (dels) setDeletedOrders(dels);
          if (prof) setProfile(prof);
          if (custs) setCustomers(custs);
        }
      };
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.ORDERS && e.newValue) {
        try { setOrders(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === 'studioerp_deleted_orders_v1' && e.newValue) {
        try { setDeletedOrders(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.PROFILE && e.newValue) {
        try { setProfile(JSON.parse(e.newValue)); } catch (err) {}
      }
      if (e.key === STORAGE_KEYS.DARK_MODE && e.newValue) {
        try { setDarkMode(JSON.parse(e.newValue)); } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, []);

  const formatCurrency = (amount: number): string => {
    const curr = profile.currency || '₹';
    if (isNaN(amount)) return `${curr} 0`;
    return `${curr} ${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const updateWhatsAppConfig = (cfg: WhatsAppGatewayConfig) => {
    setWhatsAppConfig(cfg);
  };

  // Send WhatsApp message without opening Chrome tabs
  const sendInvoiceWhatsAppBackground = async (order: StudioOrder): Promise<WhatsAppSendResult> => {
    const message = buildInvoiceWhatsAppText(order, profile);
    const phone = order.whatsappNumber || order.mobileNumber;
    const result = await sendWhatsAppMessage(phone, message, whatsAppConfig);

    const newLog: WhatsAppNotificationLog = {
      id: result.messageId,
      orderNumber: order.orderNumber,
      clientName: order.clientName,
      phone,
      status: 'delivered',
      timestamp: result.timestamp,
    };
    setWhatsAppLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    return result;
  };

  // Find customer by mobile
  const findCustomerByMobile = (mobile: string) => {
    const clean = mobile.replace(/[^0-9]/g, '');
    const customer = customers.find((c) => c.mobile.replace(/[^0-9]/g, '') === clean);
    const orderHistory = orders.filter((o) => o.mobileNumber.replace(/[^0-9]/g, '') === clean);
    return { customer, orderHistory };
  };

  // Create new order with SP-YYYYMMDD-001 format
  const createOrder = (orderData: Omit<StudioOrder, 'id' | 'orderNumber' | 'invoiceNumber' | 'createdAt'>): StudioOrder => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateCompact = todayStr.replace(/-/g, '');
    const countStr = String(orders.length + 1).padStart(3, '0');
    const newOrderId = `SP-${dateCompact}-${countStr}`;
    const newInvoiceNumber = `INV-${new Date().getFullYear()}-${countStr}`;

    const newOrder: StudioOrder = {
      ...orderData,
      id: newOrderId,
      orderNumber: newOrderId,
      invoiceNumber: newInvoiceNumber,
      createdAt: todayStr,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update or create Customer CRM Profile
    setCustomers((prev) => {
      const cleanMobile = newOrder.mobileNumber.replace(/[^0-9]/g, '');
      const existing = prev.find((c) => c.mobile.replace(/[^0-9]/g, '') === cleanMobile);

      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalVisits: c.totalVisits + 1,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + newOrder.pricing.finalTotal,
                pendingBalance: c.pendingBalance + newOrder.payment.balanceDue,
                lastVisitDate: todayStr,
                name: newOrder.clientName,
                address: newOrder.address || c.address,
              }
            : c
        );
      } else {
        const newCustomer: CustomerProfile = {
          id: `CUST-${String(prev.length + 1).padStart(3, '0')}`,
          name: newOrder.clientName,
          mobile: newOrder.mobileNumber,
          whatsapp: newOrder.whatsappNumber || newOrder.mobileNumber,
          address: newOrder.address,
          totalVisits: 1,
          totalOrders: 1,
          totalSpent: newOrder.pricing.finalTotal,
          pendingBalance: newOrder.payment.balanceDue,
          firstVisitDate: todayStr,
          lastVisitDate: todayStr,
        };
        return [newCustomer, ...prev];
      }
    });

    return newOrder;
  };

  const updateOrder = (updatedOrder: StudioOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
  };

  const deleteOrder = (id: string, reason?: string) => {
    const orderToDelete = orders.find((o) => o.id === id);
    if (orderToDelete) {
      const deletedRecord: DeletedOrder = {
        ...orderToDelete,
        deletedAt: new Date().toISOString(),
        deletedBy: `${currentRole.toUpperCase()} User`,
        deleteReason: reason || 'Deleted from invoice / orders list',
      };
      setDeletedOrders((prev) => [deletedRecord, ...prev]);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const restoreOrder = (id: string) => {
    const orderToRestore = deletedOrders.find((d) => d.id === id);
    if (orderToRestore) {
      const { deletedAt, deletedBy, deleteReason, ...restoredOrder } = orderToRestore;
      setOrders((prev) => [restoredOrder as StudioOrder, ...prev]);
      setDeletedOrders((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const permanentlyDeleteOrder = (id: string) => {
    setDeletedOrders((prev) => prev.filter((d) => d.id !== id));
  };

  const emptyTrash = () => {
    setDeletedOrders([]);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, updatedBy?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            updatedBy: updatedBy || `${currentRole.toUpperCase()} User`,
          };
        }
        return o;
      })
    );
  };

  // Update photo counts & auto recalculate extra photo pricing
  const updatePhotoCount = (orderId: string, photoCount: PhotoCountRecord, updatedBy?: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const extraSelected = Math.max(0, photoCount.clientSelected - o.pricing.includedPhotos);
          const extraPhotoTotal = extraSelected * o.pricing.extraPhotoRate;
          const newSubtotal = o.pricing.basePackagePrice + extraPhotoTotal + o.pricing.printCharges + o.pricing.frameCharges + o.pricing.laminationCharges + o.pricing.customCharges;
          const newFinalTotal = Math.max(0, newSubtotal - o.pricing.discount + o.pricing.taxAmount);
          const newBalance = Math.max(0, newFinalTotal - o.payment.advancePaid);

          return {
            ...o,
            photoCount: {
              ...photoCount,
              extraSelected,
              extraPhotoRate: o.pricing.extraPhotoRate,
            },
            pricing: {
              ...o.pricing,
              extraPhotoTotal,
              subtotal: newSubtotal,
              finalTotal: newFinalTotal,
            },
            payment: {
              ...o.payment,
              totalAmount: newFinalTotal,
              balanceDue: newBalance,
              status: newBalance === 0 ? 'fully_paid' : o.payment.advancePaid > 0 ? 'partially_paid' : 'unpaid',
            },
            status: photoCount.clientSelected > 0 && o.status === 'photoshoot_completed' ? 'photos_selected' : o.status,
            updatedBy: updatedBy || `${currentRole.toUpperCase()} User`,
          };
        }
        return o;
      })
    );
  };

  // Record payment on order
  const recordOrderPayment = (
    orderId: string,
    amount: number,
    mode: PaymentMode,
    upiApp?: UpiApp,
    ref?: string,
    updatedBy?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const newAdvance = o.payment.advancePaid + amount;
          const newBalance = Math.max(0, o.pricing.finalTotal - newAdvance);
          const newStatus: PaymentStatus = newBalance === 0 ? 'fully_paid' : newAdvance > 0 ? 'partially_paid' : 'unpaid';

          const updated: StudioOrder = {
            ...o,
            payment: {
              ...o.payment,
              advancePaid: newAdvance,
              balanceDue: newBalance,
              status: newStatus,
              mode,
              upiApp: mode === 'upi' ? upiApp : undefined,
              transactionRef: ref || o.payment.transactionRef,
            },
            updatedBy: updatedBy || `${currentRole.toUpperCase()} User`,
          };

          return updated;
        }
        return o;
      })
    );
  };

  const addOrUpdateCustomer = (
    custData: Omit<CustomerProfile, 'id' | 'totalVisits' | 'totalOrders' | 'totalSpent' | 'pendingBalance' | 'firstVisitDate' | 'lastVisitDate'>
  ): CustomerProfile => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newCust: CustomerProfile = {
      ...custData,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      totalVisits: 1,
      totalOrders: 0,
      totalSpent: 0,
      pendingBalance: 0,
      firstVisitDate: todayStr,
      lastVisitDate: todayStr,
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  // Master Handlers: Packages
  const addPackage = (pkg: Omit<ServicePackage, 'id'>) => {
    const newPkg: ServicePackage = {
      ...pkg,
      id: `PKG-${Date.now()}`,
    };
    setPackages((prev) => [...prev, newPkg]);
  };

  const updatePackage = (pkg: ServicePackage) => {
    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)));
  };

  const deletePackage = (id: string) => {
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  // Master Handlers: Frame Prices
  const addFramePrice = (frame: Omit<FramePriceConfig, 'id'>) => {
    const newFrame: FramePriceConfig = {
      ...frame,
      id: `FRM-${Date.now()}`,
    };
    setFramePrices((prev) => [...prev, newFrame]);
  };

  const updateFramePrice = (frame: FramePriceConfig) => {
    setFramePrices((prev) => prev.map((f) => (f.id === frame.id ? frame : f)));
  };

  const deleteFramePrice = (id: string) => {
    setFramePrices((prev) => prev.filter((f) => f.id !== id));
  };

  // Master Handlers: Lamination Options
  const updateLaminationOption = (lam: LaminationOptionConfig) => {
    setLaminationOptions((prev) => prev.map((l) => (l.id === lam.id ? lam : l)));
  };

  // Master Handlers: Print Only Prices
  const addPrintOnlyPrice = (print: Omit<PrintOnlyPriceConfig, 'id'>) => {
    const newPrint: PrintOnlyPriceConfig = {
      ...print,
      id: `PRT-${Date.now()}`,
    };
    setPrintOnlyPrices((prev) => [...prev, newPrint]);
  };

  const updatePrintOnlyPrice = (print: PrintOnlyPriceConfig) => {
    setPrintOnlyPrices((prev) => prev.map((p) => (p.id === print.id ? print : p)));
  };

  const deletePrintOnlyPrice = (id: string) => {
    setPrintOnlyPrices((prev) => prev.filter((p) => p.id !== id));
  };

  const addService = (srv: Omit<ServiceItemConfig, 'id'>) => {
    const newSrv: ServiceItemConfig = {
      ...srv,
      id: `SRV-${String(services.length + 1).padStart(2, '0')}`,
    };
    setServices((prev) => [...prev, newSrv]);
  };

  const updateService = (srv: ServiceItemConfig) => {
    setServices((prev) => prev.map((s) => (s.id === srv.id ? srv : s)));
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateProfile = (newProfile: StudioProfile) => {
    setProfile(newProfile);
  };

  // Compute Daily Dashboard Stats
  const getDailyStats = (): DailyStats => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrdersList = orders.filter((o) => o.createdAt === today);

    let todayRevenue = 0;
    let todayCash = 0;
    let todayUPI = 0;
    let todaySplitCount = 0;
    let todaySplitTotal = 0;

    todayOrdersList.forEach((o) => {
      todayRevenue += o.payment.advancePaid;
      if (o.payment.mode === 'cash') {
        todayCash += o.payment.advancePaid;
      } else if (o.payment.mode === 'split') {
        const cashPart = o.payment.splitDetails?.cashAmount ?? Math.round(o.payment.advancePaid / 2);
        const onlinePart = o.payment.splitDetails?.onlineAmount ?? (o.payment.advancePaid - cashPart);
        todayCash += cashPart;
        todayUPI += onlinePart;
        todaySplitCount += 1;
        todaySplitTotal += o.payment.advancePaid;
      } else {
        todayUPI += o.payment.advancePaid;
      }
    });

    const totalPendingPayments = orders.reduce((sum, o) => sum + (o.payment.balanceDue || 0), 0);
    const pendingEditingCount = orders.filter(
      (o) => o.status === 'editing_pending' || o.status === 'editing_in_progress'
    ).length;
    const readyForDeliveryCount = orders.filter((o) => o.status === 'ready_for_delivery').length;
    const completedOrdersCount = orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length;

    return {
      todayCustomers: todayOrdersList.length,
      todayOrders: todayOrdersList.length,
      todayRevenue,
      todayCash,
      todayUPI,
      totalPendingPayments,
      pendingEditingCount,
      readyForDeliveryCount,
      completedOrdersCount,
    };
  };

  const resetToDemoData = () => {
    setProfile(INITIAL_STUDIO_PROFILE);
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
    setServices(INITIAL_SERVICES);
    setPackages(INITIAL_PACKAGES);
    setFramePrices(INITIAL_FRAME_PRICES);
    setLaminationOptions(INITIAL_LAMINATION_OPTIONS);
    setPrintOnlyPrices(INITIAL_PRINT_ONLY_PRICES);
  };

  const exportDataJSON = (): string => {
    return JSON.stringify(
      {
        profile,
        orders,
        customers,
        services,
        packages,
        framePrices,
        laminationOptions,
        printOnlyPrices,
        version: '3.0.0',
      },
      null,
      2
    );
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.profile) setProfile(parsed.profile);
      if (Array.isArray(parsed.orders)) setOrders(parsed.orders);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.services)) setServices(parsed.services);
      if (Array.isArray(parsed.packages)) setPackages(parsed.packages);
      if (Array.isArray(parsed.framePrices)) setFramePrices(parsed.framePrices);
      if (Array.isArray(parsed.laminationOptions)) setLaminationOptions(parsed.laminationOptions);
      if (Array.isArray(parsed.printOnlyPrices)) setPrintOnlyPrices(parsed.printOnlyPrices);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <StudioContext.Provider
      value={{
        profile,
        orders,
        customers,
        services,
        packages,
        framePrices,
        laminationOptions,
        printOnlyPrices,
        employees,
        currentRole,
        setCurrentRole,
        activeTab,
        setActiveTab,
        darkMode,
        setDarkMode,
        whatsAppConfig,
        updateWhatsAppConfig,
        whatsAppLogs,
        sendInvoiceWhatsAppBackground,
        deletedOrders,
        createOrder,
        updateOrder,
        deleteOrder,
        restoreOrder,
        permanentlyDeleteOrder,
        emptyTrash,
        updateOrderStatus,
        updatePhotoCount,
        recordOrderPayment,
        findCustomerByMobile,
        addOrUpdateCustomer,
        addPackage,
        updatePackage,
        deletePackage,
        addFramePrice,
        updateFramePrice,
        deleteFramePrice,
        updateLaminationOption,
        addPrintOnlyPrice,
        updatePrintOnlyPrice,
        deletePrintOnlyPrice,
        addService,
        updateService,
        deleteService,
        updateProfile,
        getDailyStats,
        formatCurrency,
        resetToDemoData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used within a StudioProvider');
  return context;
};
