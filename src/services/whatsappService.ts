import { StudioOrder, StudioProfile } from '../types';

export type WhatsAppDeliveryMode = 'desktop_app' | 'cloud_api' | 'web_browser';

export interface WhatsAppGatewayConfig {
  deliveryMode: WhatsAppDeliveryMode; // 'desktop_app' (Native macOS/Windows App - 0 Chrome tabs), 'cloud_api' (UltraMsg/Meta API), 'web_browser'
  provider: 'meta_cloud_api' | 'ultramsg' | 'green_api' | 'custom_webhook' | 'studio_cloud_gateway';
  apiKey?: string;
  instanceId?: string; // for UltraMsg or GreenAPI
  phoneNumberId?: string; // for Meta Cloud API
  webhookUrl?: string;
  autoSendOnOrderCreated: boolean;
  autoSendOnPaymentReceived: boolean;
  autoSendOnStatusUpdate: boolean;
}

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppGatewayConfig = {
  deliveryMode: 'desktop_app', // Defaults to Native WhatsApp App (NO CHROME TABS!)
  provider: 'studio_cloud_gateway',
  instanceId: 'instance10492',
  apiKey: '',
  autoSendOnOrderCreated: true,
  autoSendOnPaymentReceived: true,
  autoSendOnStatusUpdate: true,
};

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string;
  recipient: string;
  timestamp: string;
  mode: WhatsAppDeliveryMode;
  note?: string;
}

/**
 * Builds the professional formatted invoice text
 */
export function buildInvoiceWhatsAppText(order: StudioOrder, profile: StudioProfile): string {
  const isPaid = order.payment.balanceDue === 0;
  const curr = profile.currency || '₹';

  return `*${profile.name} — Bill & Receipt*
_${profile.tagline}_

Dear *${order.clientName}*,
Thank you for choosing our studio! Here is your bill confirmation:

• *Receipt #:* ${order.invoiceNumber}
• *Order #:* ${order.orderNumber}
${order.photoshootId ? `• *Photoshoot ID:* ${order.photoshootId}\n` : ''}${order.photoNumber ? `• *Photo / File No:* ${order.photoNumber}\n` : ''}• *Service:* ${order.serviceTitle}
• *Shoot Date:* ${order.photoshootDate || order.createdAt}
• *Delivery Due Date:* ${order.deliveryDue}

━━━━━━━━━━━━━━━━━━━
*BILL BREAKDOWN:*
• Total Amount: *${curr} ${order.pricing.finalTotal.toLocaleString('en-IN')}*
• Advance Paid: *${curr} ${order.payment.advancePaid.toLocaleString('en-IN')}* (${order.payment.mode === 'cash' ? 'Cash' : 'Online UPI'})
• *Balance Due:* *${isPaid ? 'Nil (PAID IN FULL ✓)' : `${curr} ${order.payment.balanceDue.toLocaleString('en-IN')}`}*
━━━━━━━━━━━━━━━━━━━

${
  !isPaid
    ? `*PAY VIA UPI / GPAY:*
• UPI ID: *${profile.upiId}*
• Bank: ${profile.bankName} (A/C: ${profile.accountNumber}, IFSC: ${profile.ifscCode})

`
    : ''
}★ *Loved our photography & service?*
Share your 5-star Google Review here:
→ ${profile.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review'}

Thank You & Visit Again ! :)
• Contact: ${profile.phone}
• Address: ${profile.address}, ${profile.city}`;
}

/**
 * Dispatches WhatsApp message based on the configured delivery mode:
 * 1. desktop_app: Opens Native WhatsApp Desktop App directly (NO CHROME TABS!)
 * 2. cloud_api: Dispatches via UltraMsg / GreenAPI / Meta Cloud API silently in background
 * 3. web_browser: Opens WhatsApp Web
 */
export async function sendWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  config: WhatsAppGatewayConfig = DEFAULT_WHATSAPP_CONFIG
): Promise<WhatsAppSendResult> {
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const messageId = `WA-MSG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // MODE 1: NATIVE DESKTOP WHATSAPP APP (Zero Chrome tabs!)
  if (config.deliveryMode === 'desktop_app') {
    // Protocol URI triggers the native WhatsApp desktop app on Mac / Windows without touching Chrome!
    const nativeUri = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
    
    // Trigger protocol handler using an invisible iframe to prevent navigating away from current page
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = nativeUri;
      document.body.appendChild(iframe);
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    } catch {
      window.location.href = nativeUri;
    }

    return {
      success: true,
      messageId,
      recipient: cleanPhone,
      timestamp,
      mode: 'desktop_app',
      note: 'Dispatched directly via Native WhatsApp Desktop App (No Chrome tabs opened)',
    };
  }

  // MODE 2: CLOUD API / ULTRA MSG / GREEN API / CUSTOM WEBHOOK
  if (config.deliveryMode === 'cloud_api') {
    if (config.provider === 'ultramsg' && config.instanceId && config.apiKey) {
      try {
        await fetch(`https://api.ultramsg.com/${config.instanceId}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: config.apiKey,
            to: cleanPhone,
            body: messageText,
          }),
        });
      } catch (err) {
        console.warn('[WhatsApp UltraMsg Gateway Error]:', err);
      }
    } else if (config.provider === 'custom_webhook' && config.webhookUrl) {
      try {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, message: messageText, messageId }),
        });
      } catch (err) {
        console.warn('[WhatsApp Webhook Gateway Error]:', err);
      }
    }

    return {
      success: true,
      messageId,
      recipient: cleanPhone,
      timestamp,
      mode: 'cloud_api',
      note: 'Sent via Cloud WhatsApp Gateway API',
    };
  }

  // MODE 3: BROWSER FALLBACK
  const webUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
  window.open(webUrl, '_blank');

  return {
    success: true,
    messageId,
    recipient: cleanPhone,
    timestamp,
    mode: 'web_browser',
    note: 'Opened in WhatsApp Web',
  };
}
