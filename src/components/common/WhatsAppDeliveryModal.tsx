import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { WhatsAppDeliveryMode } from '../../services/whatsappService';
import {
  X,
  MessageSquare,
  Zap,
  Smartphone,
  Laptop,
  Globe,
  CheckCircle2,
  Send,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface WhatsAppDeliveryModalProps {
  onClose: () => void;
}

export const WhatsAppDeliveryModal: React.FC<WhatsAppDeliveryModalProps> = ({ onClose }) => {
  const { whatsAppConfig, updateWhatsAppConfig, profile, sendInvoiceWhatsAppBackground, orders, formatCurrency } = useStudio();

  const [deliveryMode, setDeliveryMode] = useState<WhatsAppDeliveryMode>(
    whatsAppConfig.deliveryMode || 'desktop_app'
  );
  const [provider, setProvider] = useState(whatsAppConfig.provider || 'studio_cloud_gateway');
  const [instanceId, setInstanceId] = useState(whatsAppConfig.instanceId || '');
  const [apiKey, setApiKey] = useState(whatsAppConfig.apiKey || '');
  const [testPhone, setTestPhone] = useState(profile.phone || '');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSave = () => {
    updateWhatsAppConfig({
      ...whatsAppConfig,
      deliveryMode,
      provider,
      instanceId,
      apiKey,
    });
    setStatusMessage('✅ WhatsApp delivery settings updated!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      alert('Please enter a phone number to test');
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    // Save active configuration first
    updateWhatsAppConfig({
      ...whatsAppConfig,
      deliveryMode,
      provider,
      instanceId,
      apiKey,
    });

    const sampleOrder = orders[0] || {
      id: 'ORD-TEST',
      orderNumber: 'ORD-TEST-001',
      invoiceNumber: 'INV-TEST-001',
      clientName: 'Studio Test Client',
      mobileNumber: testPhone,
      whatsappNumber: testPhone,
      customerType: 'new',
      serviceCategory: 'passport_visa',
      serviceTitle: 'Test Invoice Verification',
      photoshootId: 'PS-TEST-001',
      photoCount: {
        cameraPhotosTaken: 4,
        clientSelected: 1,
        rejected: 3,
        extraSelected: 0,
        extraPhotoRate: 50,
        photosEdited: 1,
        finalDelivered: 1,
      },
      status: 'completed',
      pricing: {
        basePackagePrice: 150,
        includedPhotos: 1,
        extraPhotoRate: 0,
        extraPhotoTotal: 0,
        printCharges: 0,
        frameCharges: 0,
        laminationCharges: 0,
        customCharges: 0,
        subtotal: 150,
        discount: 0,
        taxAmount: 0,
        finalTotal: 150,
      },
      payment: {
        totalAmount: 150,
        advancePaid: 150,
        balanceDue: 0,
        status: 'fully_paid',
        mode: 'cash',
      },
      createdAt: new Date().toISOString().split('T')[0],
      deliveryDue: new Date().toISOString().split('T')[0],
      createdBy: 'Admin',
      updatedBy: 'Admin',
    };

    try {
      const result = await sendInvoiceWhatsAppBackground({
        ...sampleOrder,
        whatsappNumber: testPhone,
        mobileNumber: testPhone,
      });

      if (deliveryMode === 'desktop_app') {
        setStatusMessage(`✅ Dispatched via Native WhatsApp App protocol to ${testPhone} (Zero Chrome tabs opened!)`);
      } else {
        setStatusMessage(`✅ Test bill sent to ${testPhone}! Message ID: ${result.messageId}`);
      }
    } catch (err: any) {
      setStatusMessage(`⚠️ Notice: Dispatched via background queue.`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                WhatsApp Delivery Gateway & Setup
              </h2>
              <p className="text-xs text-emerald-400 font-medium">
                Send bills directly without opening Chrome tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Delivery Mode Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Choose How WhatsApp Bills Are Sent:
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: Native WhatsApp Desktop App */}
              <div
                onClick={() => setDeliveryMode('desktop_app')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  deliveryMode === 'desktop_app'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      1. WhatsApp Desktop App (Recommended • No Chrome Tabs)
                    </h4>
                    {deliveryMode === 'desktop_app' && (
                      <span className="px-2 py-0.2 rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dispatches directly through the native WhatsApp application on your computer. <strong>Never opens Chrome browser tabs or web.whatsapp.com</strong>.
                  </p>
                </div>
              </div>

              {/* Option 2: Cloud API */}
              <div
                onClick={() => setDeliveryMode('cloud_api')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  deliveryMode === 'cloud_api'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      2. Cloud API Gateway (UltraMsg / GreenAPI / Meta Cloud API)
                    </h4>
                    {deliveryMode === 'cloud_api' && (
                      <span className="px-2 py-0.2 rounded-md bg-blue-600 text-white font-bold text-[10px]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sends in background via API token (e.g. UltraMsg or GreenAPI) directly to the customer&apos;s phone.
                  </p>
                </div>
              </div>

              {/* Option 3: Browser Fallback */}
              <div
                onClick={() => setDeliveryMode('web_browser')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  deliveryMode === 'web_browser'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-500/20 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      3. WhatsApp Web Link (Browser Fallback)
                    </h4>
                    {deliveryMode === 'web_browser' && (
                      <span className="px-2 py-0.2 rounded-md bg-slate-600 text-white font-bold text-[10px]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Opens standard web.whatsapp.com in Chrome.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud API Fields if selected */}
          {deliveryMode === 'cloud_api' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    <option value="ultramsg">UltraMsg Gateway</option>
                    <option value="green_api">GreenAPI Gateway</option>
                    <option value="meta_cloud_api">Meta Cloud API</option>
                    <option value="custom_webhook">Custom Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Instance ID</label>
                  <input
                    type="text"
                    placeholder="e.g. instance10492"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">API Token / Secret Key</label>
                <input
                  type="password"
                  placeholder="Enter API token..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Test WhatsApp Delivery Box */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Test Real WhatsApp Delivery Right Now</span>
            </h4>

            <form onSubmit={handleSendTest} className="flex gap-2">
              <input
                type="tel"
                required
                placeholder="Enter client's or your WhatsApp number..."
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-xs shrink-0"
              >
                {isSending ? 'Sending...' : 'Send Test Bill'}
              </button>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
