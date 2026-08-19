import React, { useState } from 'react';
import { StudioOrder, PaymentMode, UpiApp } from '../../types';
import { useStudio } from '../../context/StudioContext';
import {
  X,
  Save,
  Trash2,
  Plus,
  Receipt,
  User,
  Phone,
  Calendar,
  CreditCard,
  Tag,
  MapPin,
  CheckCircle2,
  Camera,
} from 'lucide-react';

interface InvoiceLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceEditModalProps {
  order: StudioOrder;
  onClose: () => void;
  onSaved?: (updatedOrder: StudioOrder) => void;
}

export const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  order,
  onClose,
  onSaved,
}) => {
  const { updateOrder, formatCurrency } = useStudio();

  // Client Info State
  const [clientName, setClientName] = useState(order.clientName);
  const [mobileNumber, setMobileNumber] = useState(order.mobileNumber);
  const [whatsappNumber, setWhatsappNumber] = useState(order.whatsappNumber || order.mobileNumber);
  const [address, setAddress] = useState(order.address || '');

  // Order Details State
  const [serviceTitle, setServiceTitle] = useState(order.serviceTitle);
  const [photoNumber, setPhotoNumber] = useState(order.photoNumber || '');
  const [deliveryDue, setDeliveryDue] = useState(order.deliveryDue);
  const [orderDate, setOrderDate] = useState(order.createdAt);
  const [notes, setNotes] = useState(order.notes || '');

  // Line Items State
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: '1',
      name: order.serviceTitle,
      description: order.notes || 'Studio Production',
      quantity: order.passportSpecs?.quantity || 1,
      rate: order.pricing.basePackagePrice || order.pricing.subtotal || order.pricing.finalTotal,
      amount: order.pricing.basePackagePrice || order.pricing.subtotal || order.pricing.finalTotal,
    },
  ]);

  // Pricing & Discounts State
  const [discount, setDiscount] = useState<number>(order.pricing.discount || 0);

  // Payment State
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(order.payment.mode || 'cash');
  const [advancePaid, setAdvancePaid] = useState<number>(order.payment.advancePaid || 0);
  const [upiApp, setUpiApp] = useState<UpiApp>(order.payment.upiApp || 'gpay');

  // Split Payment State
  const [splitCash, setSplitCash] = useState<number>(
    order.payment.splitDetails?.cashAmount || Math.round((order.payment.advancePaid || 0) / 2)
  );
  const [splitOnline, setSplitOnline] = useState<number>(
    order.payment.splitDetails?.onlineAmount ||
      Math.max(0, (order.payment.advancePaid || 0) - Math.round((order.payment.advancePaid || 0) / 2))
  );
  const [splitUpiApp, setSplitUpiApp] = useState<UpiApp>(
    order.payment.splitDetails?.upiApp || 'gpay'
  );

  // Line item handlers
  const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty = Number(field === 'quantity' ? value : item.quantity) || 0;
        const rate = Number(field === 'rate' ? value : item.rate) || 0;
        item.amount = qty * rate;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'Additional Service / Extra Print',
        description: '',
        quantity: 1,
        rate: 100,
        amount: 100,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Invoice must have at least one line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Pricing calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const effectiveDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
  const finalTotal = Math.max(0, subtotal - effectiveDiscount);

  const effectivePaid =
    paymentMode === 'split'
      ? Math.max(0, Number(splitCash || 0) + Number(splitOnline || 0))
      : Math.max(0, Number(advancePaid || 0));

  const balanceDue = Math.max(0, finalTotal - effectivePaid);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !mobileNumber.trim()) {
      alert('Please fill client name and mobile number');
      return;
    }

    const updatedOrder: StudioOrder = {
      ...order,
      clientName: clientName.trim(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
      address: address.trim(),
      serviceTitle: serviceTitle.trim(),
      photoNumber: photoNumber.trim() || undefined,
      deliveryDue,
      createdAt: orderDate,
      notes: notes.trim(),
      pricing: {
        ...order.pricing,
        subtotal,
        discount: effectiveDiscount,
        finalTotal,
        basePackagePrice: items[0]?.amount || finalTotal,
      },
      payment: {
        ...order.payment,
        totalAmount: finalTotal,
        advancePaid: effectivePaid,
        balanceDue,
        status: effectivePaid >= finalTotal ? 'fully_paid' : effectivePaid > 0 ? 'partially_paid' : 'unpaid',
        mode: paymentMode,
        upiApp: paymentMode === 'upi' ? upiApp : paymentMode === 'split' ? splitUpiApp : undefined,
        splitDetails:
          paymentMode === 'split'
            ? {
                cashAmount: Number(splitCash) || 0,
                onlineAmount: Number(splitOnline) || 0,
                upiApp: splitUpiApp,
              }
            : undefined,
      },
      updatedBy: 'Staff Editor',
    };

    updateOrder(updatedOrder);

    if (onSaved) {
      onSaved(updatedOrder);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-backdrop">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left my-6 animate-popup">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>Edit Client Invoice</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 font-mono">
                  #{order.invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Modify billing items, discount, advance payment, and client information
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* 1. Customer Information Section */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              <span>Customer Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="Same as mobile if blank"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Order & Meta Details */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Service & Reference Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Service Title
                </label>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Photo Ref / DSC_ File No.
                </label>
                <input
                  type="text"
                  value={photoNumber}
                  onChange={(e) => setPhotoNumber(e.target.value)}
                  placeholder="e.g. DSC_4092, WA_IMG"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-xs font-mono font-bold text-amber-700 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Delivery Due Date
                </label>
                <input
                  type="date"
                  value={deliveryDue}
                  onChange={(e) => setDeliveryDue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Invoice Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Invoice Line Items</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs font-bold text-slate-900 dark:text-white"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs text-center font-bold"
                        />
                      </td>
                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          className="w-24 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-xs text-right font-bold"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Discounts, Payment & Advance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Discount & Concessions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Discount / Concession</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {[0, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDiscount(val)}
                    className="text-[10px] px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-amber-500/20 cursor-pointer"
                  >
                    ₹{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Payment & Mode */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Payment Mode & Advance</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="cash">💵 Cash in Hand</option>
                  <option value="upi">📱 UPI (GPay / PhonePe)</option>
                  <option value="split">⚡ Split (Cash + Online UPI)</option>
                  <option value="card">💳 Card / POS</option>
                </select>
              </div>

              {paymentMode === 'split' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      💵 Cash (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={splitCash || ''}
                      onChange={(e) => setSplitCash(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold text-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      📱 UPI (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={splitOnline || ''}
                      onChange={(e) => setSplitOnline(Math.max(0, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 text-xs font-bold text-indigo-700"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={finalTotal}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Financial Totals Summary Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Subtotal:</span>
              <p className="font-extrabold text-sm">{formatCurrency(subtotal)}</p>
            </div>
            <div>
              <span className="text-slate-400">Discount:</span>
              <p className="font-extrabold text-sm text-amber-400">- {formatCurrency(effectiveDiscount)}</p>
            </div>
            <div>
              <span className="text-slate-400">Net Total:</span>
              <p className="font-black text-base text-white">{formatCurrency(finalTotal)}</p>
            </div>
            <div>
              <span className="text-slate-400">Paid Now:</span>
              <p className="font-extrabold text-sm text-emerald-400">{formatCurrency(effectivePaid)}</p>
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-slate-400">Balance Due:</span>
              <p className={`font-black text-base font-mono ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(balanceDue)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
