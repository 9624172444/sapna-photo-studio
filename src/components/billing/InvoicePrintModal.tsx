import React, { useState, useRef } from 'react';
import { Invoice, StudioOrder } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toBlob } from 'html-to-image';
import {
  Printer,
  X,
  Share2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Camera,
  Edit3,
  Download,
  Image as ImageIcon,
  Loader2,
  Smile,
} from 'lucide-react';
import { InvoiceEditModal } from './InvoiceEditModal';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const { profile, formatCurrency, orders } = useStudio();
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  // Find linked order if available for camera photo count tracking
  const linkedOrder = orders.find(
    (o) => o.invoiceNumber === invoice.invoiceNumber || o.clientName === invoice.clientName
  );

  // Dynamic invoice values (if linked order was edited)
  const currentInvoice: Invoice = linkedOrder
    ? {
        ...invoice,
        clientName: linkedOrder.clientName,
        clientPhone: linkedOrder.mobileNumber,
        subtotal: linkedOrder.pricing.subtotal,
        discount: linkedOrder.pricing.discount,
        total: linkedOrder.pricing.finalTotal,
        paidAmount: linkedOrder.payment.advancePaid,
        balanceDue: linkedOrder.payment.balanceDue,
        status: linkedOrder.payment.status === 'fully_paid' ? 'paid' : linkedOrder.payment.status === 'partially_paid' ? 'partially_paid' : 'pending',
      }
    : invoice;

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(
    profile.name
  )}&am=${currentInvoice.balanceDue > 0 ? currentInvoice.balanceDue : currentInvoice.total}&cu=INR&tn=Invoice%20${encodeURIComponent(
    currentInvoice.invoiceNumber
  )}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!printableRef.current) return;
    try {
      setIsGeneratingImage(true);
      const dataUrl = await toPng(printableRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Invoice_${currentInvoice.invoiceNumber}_${currentInvoice.clientName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate invoice image:', err);
      alert('Could not download image. Please try printing to PDF.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleWhatsAppShare = async () => {
    const cleanPhone = currentInvoice.clientPhone.replace(/[^0-9]/g, '');
    const googleReviewLink = profile.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review';
    const text = `*${profile.name} — Bill & Receipt*\n\nDear *${currentInvoice.clientName}*,\nThank you for choosing ${profile.name}!\n\n• *Service:* ${currentInvoice.eventType.toUpperCase()} (${currentInvoice.eventDate})\n• *Total Bill:* ${formatCurrency(currentInvoice.total)}\n• *Advance Paid:* ${formatCurrency(currentInvoice.paidAmount)}\n• *Balance Due:* ${formatCurrency(currentInvoice.balanceDue)}\n• *Due Date:* ${currentInvoice.dueDate}\n\n*Pay via UPI:* ${profile.upiId}\nBank: ${profile.bankName} (A/C: ${profile.accountNumber}, IFSC: ${profile.ifscCode})\n\n⭐ *Loved our service?*\nDear *${currentInvoice.clientName}*, kindly share your 5-star Google Review:\n👉 ${googleReviewLink}\n\n📍 *${profile.name}, Mansa*\nPh: ${profile.phone}\n_Visit Again ! 😊_`;

    if (printableRef.current) {
      try {
        setIsGeneratingImage(true);
        const blob = await toBlob(printableRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });

        if (blob) {
          const file = new File(
            [blob],
            `Invoice_${currentInvoice.invoiceNumber}.png`,
            { type: 'image/png' }
          );

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Invoice #${currentInvoice.invoiceNumber} - ${profile.name}`,
              text,
              files: [file],
            });
            setIsGeneratingImage(false);
            return;
          }

          if (navigator.clipboard && (window as any).ClipboardItem) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({
                'image/png': blob,
              }),
            ]);
          }
        }
      } catch (e) {
        console.warn('Web Share API error:', e);
      } finally {
        setIsGeneratingImage(false);
      }
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-backdrop">
      {/* Inline Edit Modal */}
      {isEditing && linkedOrder && (
        <InvoiceEditModal
          order={linkedOrder}
          onClose={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
          }}
        />
      )}

      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-300 animate-popup">
        {/* Action Header bar (hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base text-amber-400">Invoice & Receipt</span>
            <span className="text-xs text-slate-400">#{currentInvoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {linkedOrder && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                title="Edit Client Information, Line Items, Discounts or Advance"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Invoice</span>
              </button>
            )}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download Invoice as PNG Image"
            >
              {isGeneratingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Download className="w-3.5 h-3.5 text-amber-400" />}
              <span>Image PNG</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              disabled={isGeneratingImage}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
              title="Share Image & Bill on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div ref={printableRef} id="printable-invoice" className="p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-7 bg-white text-slate-900 text-left">
          {/* Header with Studio Logo & Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-200">
            <div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl p-1 bg-white border-2 border-amber-500/40 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                  <img
                    src="/sapna_logo.png"
                    alt="Sapna Photo Studio Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    {profile.name}
                  </h1>
                  <p className="text-xs font-bold text-amber-600 mt-0.5">{profile.tagline}</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-3 space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.address}, {profile.city}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.phone} (WhatsApp: {profile.whatsapp || profile.phone})</span>
                </p>
                {profile.gstNumber && (
                  <p className="font-semibold text-slate-700">
                    GSTIN / Tax ID: <span className="font-mono">{profile.gstNumber}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right: Invoice Tag, IDs & Status */}
            <div className="sm:text-right space-y-1.5">
              <div className="inline-block px-3.5 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-sm tracking-wider uppercase">
                INVOICE & RECEIPT
              </div>
              <p className="text-sm font-bold text-slate-900 font-mono">Invoice #: {currentInvoice.invoiceNumber}</p>
              {linkedOrder?.orderNumber && (
                <p className="text-xs text-slate-600 font-mono">Order ID: {linkedOrder.orderNumber}</p>
              )}
              {linkedOrder?.photoshootId && (
                <p className="text-xs text-amber-600 font-mono font-bold">Photoshoot ID: {linkedOrder.photoshootId}</p>
              )}
              {linkedOrder?.photoNumber && (
                <p className="text-xs text-slate-900 font-mono font-extrabold bg-amber-50 dark:bg-amber-100/50 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                  {linkedOrder.photoSource === 'whatsapp' || linkedOrder.photoNumber.startsWith('WA_')
                    ? '📱 WhatsApp Image: '
                    : linkedOrder.photoSource === 'scan' || linkedOrder.photoNumber.startsWith('SCAN_')
                    ? '🖼️ Scan Ref: '
                    : linkedOrder.photoSource === 'usb'
                    ? '💾 USB Ref: '
                    : '📸 Camera Photo No: '}
                  {linkedOrder.photoNumber}
                </p>
              )}
              <p className="text-xs text-slate-500">Date: {currentInvoice.issueDate}</p>
              <p className="text-xs text-slate-500">Delivery Due: {linkedOrder?.deliveryDue || currentInvoice.dueDate}</p>

              <div className="pt-1">
                {currentInvoice.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    <CheckCircle className="w-3.5 h-3.5" />
                    PAID IN FULL
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    PARTIALLY PAID
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Client Details & Photoshoot Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                CLIENT DETAILS:
              </p>
              <h3 className="font-bold text-base text-slate-900 mt-1">{currentInvoice.clientName}</h3>
              <p className="text-slate-600 mt-0.5">Mobile / WhatsApp: {currentInvoice.clientPhone}</p>
              {linkedOrder?.address && (
                <p className="text-slate-500 mt-0.5">Address: {linkedOrder.address}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                PHOTOSHOOT / SERVICE DETAILS:
              </p>
              <p className="font-bold text-sm text-slate-900 mt-1 capitalize">
                {linkedOrder?.serviceTitle || currentInvoice.eventType.replace(/_/g, ' ')}
              </p>
              {linkedOrder?.photoNumber && (
                <p className="text-purple-700 font-bold mt-0.5">
                  <span className="font-medium text-slate-600">Photo / File No:</span> {linkedOrder.photoNumber}
                </p>
              )}
              <p className="text-slate-600 mt-0.5">
                <span className="font-medium">Date:</span> {currentInvoice.eventDate}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Camera / Intake:</span> {linkedOrder?.cameraUsed || 'Studio Production'}
              </p>
            </div>
          </div>

          {/* Camera Photo Tracking Block */}
          {linkedOrder?.photoCount && linkedOrder.photoCount.cameraPhotosTaken > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>Camera Photo Tracking Details:</span>
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500">Camera Shots</span>
                  <p className="font-extrabold text-sm text-slate-900">{linkedOrder.photoCount.cameraPhotosTaken}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500">Client Selected</span>
                  <p className="font-extrabold text-sm text-emerald-600">{linkedOrder.photoCount.clientSelected}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500">Photos Edited</span>
                  <p className="font-extrabold text-sm text-purple-600">{linkedOrder.photoCount.photosEdited}</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500">Final Delivered</span>
                  <p className="font-extrabold text-sm text-teal-600">{linkedOrder.photoCount.finalDelivered || linkedOrder.photoCount.photosEdited}</p>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700">
                  <th className="py-3 px-3 font-bold w-12 text-center">#</th>
                  <th className="py-3 px-3 font-bold">Description</th>
                  <th className="py-3 px-3 font-bold text-center w-20">Quantity</th>
                  <th className="py-3 px-3 font-bold text-right w-28">Rate ({profile.currency})</th>
                  <th className="py-3 px-3 font-bold text-right w-32">Amount ({profile.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentInvoice.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 text-sm">
                        {linkedOrder && idx === 0 ? linkedOrder.serviceTitle : item.name}
                      </p>
                      {item.description && (
                        <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-800">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {item.rate.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {(linkedOrder && idx === 0 ? linkedOrder.pricing.subtotal : item.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Breakdown & Dynamic UPI Payment QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t-2 border-slate-200">
            {/* Left: Dynamic UPI QR Code (Only if UPI ID configured) */}
            <div className="md:col-span-7 space-y-3">
              {profile.upiId ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-4">
                  <div className="bg-white p-2 rounded-xl border border-amber-300 shadow-xs shrink-0">
                    <QRCodeSVG value={upiPaymentUri} size={90} level="M" />
                    <p className="text-[8px] text-center font-bold text-slate-500 mt-1">SCAN TO PAY</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">Pay via GPay / PhonePe / Paytm</h4>
                    <p className="text-slate-600">
                      UPI ID:{' '}
                      <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {profile.upiId}
                      </span>
                    </p>
                    {profile.bankName && (
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Bank: {profile.bankName} &bull; A/C: {profile.accountNumber} &bull; IFSC: {profile.ifscCode}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <h4 className="font-bold text-slate-900">Payment Accepted via Cash / Counter UPI</h4>
                  <p className="text-[11px] text-slate-500">Thank you for visiting {profile.name}! Please retain this bill for photo pickup.</p>
                </div>
              )}
            </div>

            {/* Right: Calculations */}
            <div className="md:col-span-5 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(currentInvoice.subtotal)}</span>
              </div>

              {currentInvoice.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 font-bold">
                  <span>Discount:</span>
                  <span>- {formatCurrency(currentInvoice.discount)}</span>
                </div>
              )}

              <div className="flex justify-between py-1.5 border-t-2 border-slate-300 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span>{formatCurrency(currentInvoice.total)}</span>
              </div>

              <div className="flex justify-between py-1 text-emerald-700 bg-emerald-50 px-2 rounded-lg font-bold">
                <span>Advance Paid:</span>
                <span>{formatCurrency(currentInvoice.paidAmount)}</span>
              </div>

              {linkedOrder?.payment?.mode === 'split' && linkedOrder.payment.splitDetails && (
                <div className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-md space-y-0.5 border border-slate-200">
                  <span className="font-bold block text-slate-800">⚡ Split Payment Mode:</span>
                  <div className="flex justify-between">
                    <span>💵 Cash Received:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(linkedOrder.payment.splitDetails.cashAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>📱 Online UPI ({linkedOrder.payment.splitDetails.upiApp?.toUpperCase() || 'UPI'}):</span>
                    <span className="font-bold text-slate-900">{formatCurrency(linkedOrder.payment.splitDetails.onlineAmount)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between py-2 bg-slate-900 text-white px-3 rounded-xl text-sm font-extrabold">
                <span>Balance Due:</span>
                <span className="text-amber-400">{formatCurrency(currentInvoice.balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Footer note & Signature */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-center sm:text-left space-y-1">
              <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 justify-center sm:justify-start">
                <span>Thank You! Visit Again !</span>
                <Smile className="w-4 h-4 text-amber-500 fill-amber-500/20 stroke-[2.2]" />
              </p>
              <p className="text-[11px] text-slate-500">For inquiries & booking, call {profile.phone}</p>
              <p className="text-[10px] font-bold text-amber-700">
                ⭐ Loved our service? Share your Google Review: <span className="font-mono underline">{profile.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review'}</span>
              </p>
            </div>

            <div className="border-t border-slate-300 pt-1 text-center sm:text-right w-44">
              <p className="font-bold text-slate-900 text-xs">Authorized Signature</p>
              <p className="text-[10px] text-slate-500">{profile.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
