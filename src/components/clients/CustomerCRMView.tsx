import React, { useState } from 'react';
import { CustomerProfile, StudioOrder } from '../../types';
import { useStudio } from '../../context/StudioContext';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  ShoppingBag,
} from 'lucide-react';

export const CustomerCRMView: React.FC = () => {
  const { customers, orders, formatCurrency, profile, resetToDemoData } = useStudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Combine customers from customer state and order records so no client is ever omitted
  const allMergedCustomers: CustomerProfile[] = React.useMemo(() => {
    const custMap = new Map<string, CustomerProfile>();

    customers.forEach((c) => {
      custMap.set(c.mobile.replace(/[^0-9]/g, ''), { ...c });
    });

    orders.forEach((o) => {
      const cleanPhone = o.mobileNumber.replace(/[^0-9]/g, '');
      if (!custMap.has(cleanPhone)) {
        custMap.set(cleanPhone, {
          id: o.customerId || `CUST-${cleanPhone}`,
          name: o.clientName,
          mobile: o.mobileNumber,
          whatsapp: o.whatsappNumber || o.mobileNumber,
          address: o.address || '',
          totalVisits: 1,
          totalOrders: 1,
          totalSpent: o.pricing.finalTotal,
          pendingBalance: o.payment.balanceDue,
          firstVisitDate: o.createdAt,
          lastVisitDate: o.createdAt,
          notes: o.notes || '',
        });
      }
    });

    return Array.from(custMap.values());
  }, [customers, orders]);

  const filteredCustomers = allMergedCustomers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.mobile.includes(q) || (c.address && c.address.toLowerCase().includes(q));
  });

  const openWhatsApp = (mobile: string, name: string) => {
    const cleanPhone = mobile.replace(/[^0-9]/g, '');
    const text = `Hello ${name}! Greetings from ${profile.name}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Customer Profiles & Visit History ({allMergedCustomers.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View lifetime spend, total visits, past order history & pending balances for every client
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Mobile or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={resetToDemoData}
            title="Reload default client database"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition whitespace-nowrap cursor-pointer"
          >
            🔄 Reload Clients
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const clientOrders = orders.filter(
            (o) => o.mobileNumber.replace(/[^0-9]/g, '') === cust.mobile.replace(/[^0-9]/g, '')
          );

          return (
            <div
              key={cust.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-amber-500/40 transition shadow-xs"
            >
              {/* Top: Name & Mobile */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{cust.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-amber-500" />
                    <span>{cust.mobile}</span>
                  </p>
                  {cust.address && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3" />
                      <span>{cust.address}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => openWhatsApp(cust.mobile, cust.name)}
                  className="p-2 rounded-xl bg-emerald-600/15 text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                  title="WhatsApp Client"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              {/* CRM Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Total Visits</span>
                  <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{cust.totalVisits}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Lifetime Spent</span>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {formatCurrency(cust.totalSpent)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Pending Due</span>
                  <p className={`font-extrabold mt-0.5 ${cust.pendingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                    {cust.pendingBalance > 0 ? formatCurrency(cust.pendingBalance) : '₹0'}
                  </p>
                </div>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Order History ({clientOrders.length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {clientOrders.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No past orders</p>
                  ) : (
                    clientOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{ord.serviceTitle}</p>
                          <p className="text-[10px] text-slate-400">{ord.createdAt} &bull; #{ord.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(ord.pricing.finalTotal)}</span>
                          <p className="text-[9px] uppercase font-bold text-indigo-500 capitalize">{ord.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
