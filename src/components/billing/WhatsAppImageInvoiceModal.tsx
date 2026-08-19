import React, { useRef, useState } from 'react';
import { StudioOrder } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toBlob } from 'html-to-image';
import {
  X,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Phone,
  Camera,
  Printer,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Send,
  Loader2,
  Image as ImageIcon,
  Palette,
  Check,
  Zap,
  Clock,
  Receipt,
  QrCode,
  Smile,
  Heart,
} from 'lucide-react';

interface WhatsAppImageInvoiceModalProps {
  order: StudioOrder;
  onClose: () => void;
}

// User-specified Color Palette:
// 1. #291C0E (Deep Espresso / Rich Mocha)
// 2. #6E473B (Chestnut Bronze)
// 3. #A78D78 (Warm Taupe)
// 4. #BEB5A9 (Cashmere Sand)
// 5. #E1D4C2 (Champagne Ivory / Cream Linen)

type CardTheme = 'espresso_dark' | 'cream_ivory' | 'chestnut_warm';

export const WhatsAppImageInvoiceModal: React.FC<WhatsAppImageInvoiceModalProps> = ({
  order,
  onClose,
}) => {
  const { profile, formatCurrency } = useStudio();
  const invoiceCardRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<CardTheme>('espresso_dark');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const balanceDue = order.payment.balanceDue || 0;
  const isFullyPaid = balanceDue <= 0;
  const isSplit = order.payment.mode === 'split';

  const upiId = profile.upiId || '9879822507@okbizaxis';
  const studioName = profile.name || 'Sapna Photo Studio';
  const studioPhone = profile.phone || '+91 98798 22507';

  const upiPaymentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    studioName
  )}&am=${balanceDue > 0 ? balanceDue : order.pricing.finalTotal}&cu=INR&tn=Invoice%20${encodeURIComponent(
    order.invoiceNumber
  )}`;

  // Extract client initials
  const initials = order.clientName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'SP';

  // 1. Generate and Download PNG
  const handleDownloadImage = async () => {
    if (!invoiceCardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(invoiceCardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Ultra-crisp 3x Retina output
      });
      const link = document.createElement('a');
      link.download = `Sapna_Photo_Studio_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      setStatusMessage('✅ HD Invoice image downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to generate image:', err);
      alert('Could not generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!invoiceCardRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await toBlob(invoiceCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopySuccess(true);
        setStatusMessage('✅ Aesthetic Receipt copied! Press Ctrl+V in WhatsApp to paste.');
        setTimeout(() => {
          setCopySuccess(false);
          setStatusMessage(null);
        }, 4000);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Direct Send Bill Photo to WhatsApp
  const handleShareOnWhatsApp = async () => {
    if (!invoiceCardRef.current) return;

    // Normalize phone number (auto-prefix India 91 if 10 digits)
    let rawPhone = (order.whatsappNumber || order.mobileNumber || '').replace(/[^0-9]/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    try {
      setIsGenerating(true);
      const blob = await toBlob(invoiceCardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });

      if (blob) {
        const fileName = `Sapna_Photo_Studio_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;

        // Copy Photo to Clipboard so user can press Ctrl+V / Paste in WhatsApp
        if (navigator.clipboard && (window as any).ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({
                'image/png': blob,
              }),
            ]);
          } catch (clipErr) {
            console.warn('Clipboard write failed:', clipErr);
          }
        }
      }
    } catch (err) {
      console.warn('Image generation error:', err);
    } finally {
      setIsGenerating(false);
    }

    // Direct WhatsApp Chat Link (with country code 91, NO message parameter)
    const whatsappUrl = `https://wa.me/${phone}`;
    window.open(whatsappUrl, '_blank');
    setStatusMessage('🚀 WhatsApp Opened! Bill Photo is copied to your clipboard — Press Ctrl+V (Paste) in WhatsApp to send the photo!');
    setTimeout(() => setStatusMessage(null), 8000);
  };

  // 4. Direct Google Review WhatsApp Action (Universal Safe Characters)
  const handleSendGoogleReviewWhatsApp = async () => {
    const phone = (order.whatsappNumber || order.mobileNumber).replace(/[^0-9]/g, '');
    const googleReviewLink = profile.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review';
    const reviewText = `Hello *${order.clientName}*! :)\n\nThank you for choosing *${studioName}, Mansa* for your *${order.serviceTitle}*.\n\n★ *Loved our photography & service?*\nKindly take 30 seconds to share your 5-star Google Review here:\n→ ${googleReviewLink}\n\nThank you & Visit Again ! :)`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(reviewText);
      }
    } catch (e) {}

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(reviewText)}`;
    window.open(whatsappUrl, '_blank');
    setStatusMessage('⭐ Google Review request opened in WhatsApp!');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-backdrop">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 text-left my-6 flex flex-col max-h-[94vh] animate-popup">
        {/* Top Action Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black shadow-md"
              style={{ backgroundColor: '#6E473B', color: '#E1D4C2' }}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Aesthetic Studio Receipt</span>
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border"
                  style={{ backgroundColor: '#291C0E', color: '#E1D4C2', borderColor: '#6E473B' }}
                >
                  Mocha & Ivory
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {order.clientName} &bull; #{order.invoiceNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Selector Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setTheme('espresso_dark')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  theme === 'espresso_dark'
                    ? 'shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={theme === 'espresso_dark' ? { backgroundColor: '#291C0E', color: '#E1D4C2', border: '1px solid #6E473B' } : {}}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#6E473B' }} />
                <span>Espresso Luxury</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('cream_ivory')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  theme === 'cream_ivory'
                    ? 'shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={theme === 'cream_ivory' ? { backgroundColor: '#E1D4C2', color: '#291C0E', border: '1px solid #A78D78' } : {}}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#BEB5A9' }} />
                <span>Cream Ivory</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('chestnut_warm')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  theme === 'chestnut_warm'
                    ? 'shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={theme === 'chestnut_warm' ? { backgroundColor: '#6E473B', color: '#E1D4C2', border: '1px solid #A78D78' } : {}}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#A78D78' }} />
                <span>Chestnut Bronze</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Theme Selector */}
        <div className="flex sm:hidden items-center justify-center gap-1.5 p-2 bg-slate-950 border-b border-slate-800 text-[11px] font-bold">
          <button
            onClick={() => setTheme('espresso_dark')}
            className="px-2.5 py-1 rounded-lg"
            style={theme === 'espresso_dark' ? { backgroundColor: '#291C0E', color: '#E1D4C2', border: '1px solid #6E473B' } : { backgroundColor: '#1e293b', color: '#94a3b8' }}
          >
            ☕ Espresso
          </button>
          <button
            onClick={() => setTheme('cream_ivory')}
            className="px-2.5 py-1 rounded-lg"
            style={theme === 'cream_ivory' ? { backgroundColor: '#E1D4C2', color: '#291C0E', border: '1px solid #A78D78' } : { backgroundColor: '#1e293b', color: '#94a3b8' }}
          >
            📜 Cream Ivory
          </button>
          <button
            onClick={() => setTheme('chestnut_warm')}
            className="px-2.5 py-1 rounded-lg"
            style={theme === 'chestnut_warm' ? { backgroundColor: '#6E473B', color: '#E1D4C2', border: '1px solid #A78D78' } : { backgroundColor: '#1e293b', color: '#94a3b8' }}
          >
            🌰 Chestnut
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center animate-in fade-in shrink-0">
            {statusMessage}
          </div>
        )}

        {/* Scrollable Card Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950/70 flex flex-col items-center">
          {/* ========================================================================= */}
          {/* THE LUXURY PAYMENT RECEIPT CARD (Styled with #291C0E, #6E473B, #A78D78, #BEB5A9, #E1D4C2) */}
          {/* ========================================================================= */}
          <div
            ref={invoiceCardRef}
            className="w-full rounded-3xl shadow-2xl overflow-hidden font-sans select-none border-2 transition-all"
            style={
              theme === 'espresso_dark'
                ? {
                    backgroundColor: '#291C0E',
                    color: '#E1D4C2',
                    borderColor: '#6E473B',
                    width: '480px',
                    maxWidth: '100%',
                  }
                : theme === 'chestnut_warm'
                ? {
                    backgroundColor: '#6E473B',
                    color: '#E1D4C2',
                    borderColor: '#A78D78',
                    width: '480px',
                    maxWidth: '100%',
                  }
                : {
                    backgroundColor: '#E1D4C2',
                    color: '#291C0E',
                    borderColor: '#A78D78',
                    width: '480px',
                    maxWidth: '100%',
                  }
            }
          >
            {/* Color Palette Swatch Accent Bar */}
            <div className="h-2 w-full flex">
              <div className="h-full w-1/5" style={{ backgroundColor: '#291C0E' }} />
              <div className="h-full w-1/5" style={{ backgroundColor: '#6E473B' }} />
              <div className="h-full w-1/5" style={{ backgroundColor: '#A78D78' }} />
              <div className="h-full w-1/5" style={{ backgroundColor: '#BEB5A9' }} />
              <div className="h-full w-1/5" style={{ backgroundColor: '#E1D4C2' }} />
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              {/* Studio Header */}
              <div
                className="flex items-start justify-between border-b pb-4"
                style={{
                  borderColor: theme === 'cream_ivory' ? '#BEB5A9' : '#6E473B',
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl p-0.5 flex items-center justify-center font-black shadow-md overflow-hidden shrink-0 border"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#A78D78',
                      }}
                    >
                      <img
                        src="/sapna_logo.png"
                        alt="Sapna Photo Studio Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1
                        className="text-lg font-black tracking-tight uppercase"
                        style={{
                          color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                        }}
                      >
                        {studioName}
                      </h1>
                    </div>
                  </div>
                  <p
                    className="text-[10.5px] font-bold"
                    style={{
                      color: theme === 'cream_ivory' ? '#6E473B' : '#BEB5A9',
                    }}
                  >
                    Photography &bull; Lab Glossy Prints &bull; Ornate Framing
                  </p>
                  <p
                    className="text-[9.5px] font-medium flex items-center gap-1.5"
                    style={{
                      color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78',
                    }}
                  >
                    <span>📍 Station Road, Mansa, Gandhinagar</span>
                    <span>&bull;</span>
                    <span>📞 {studioPhone}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className="inline-block font-mono font-black text-[10.5px] px-3 py-1 rounded-lg tracking-wider uppercase border shadow-xs"
                    style={{
                      backgroundColor: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                      color: theme === 'cream_ivory' ? '#E1D4C2' : '#291C0E',
                      borderColor: '#A78D78',
                    }}
                  >
                    RECEIPT
                  </span>
                  <p
                    className="text-[10.5px] font-mono font-bold mt-1"
                    style={{
                      color: theme === 'cream_ivory' ? '#6E473B' : '#BEB5A9',
                    }}
                  >
                    #{order.invoiceNumber}
                  </p>
                </div>
              </div>

              {/* Billed To Client Card */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xs"
                style={
                  theme === 'cream_ivory'
                    ? {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#BEB5A9',
                      }
                    : theme === 'chestnut_warm'
                    ? {
                        backgroundColor: '#291C0E',
                        borderColor: '#A78D78',
                      }
                    : {
                        backgroundColor: '#1E140A',
                        borderColor: '#6E473B',
                      }
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md"
                    style={{
                      backgroundColor: '#6E473B',
                      color: '#E1D4C2',
                      border: '1px solid #A78D78',
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-wider block"
                      style={{
                        color: theme === 'cream_ivory' ? '#A78D78' : '#BEB5A9',
                      }}
                    >
                      Customer Details
                    </span>
                    <strong
                      className="text-sm font-black block"
                      style={{
                        color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                      }}
                    >
                      {order.clientName}
                    </strong>
                    <span
                      className="text-[11px] font-mono font-bold flex items-center gap-1"
                      style={{ color: '#34A853' }}
                    >
                      📱 {order.mobileNumber}
                    </span>
                  </div>
                </div>

                <div className="text-right text-[10.5px] space-y-0.5">
                  <div>
                    <span
                      style={{ color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78' }}
                    >
                      Date:{' '}
                    </span>
                    <strong
                      style={{ color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2' }}
                    >
                      {order.createdAt}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{ color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78' }}
                    >
                      Due:{' '}
                    </span>
                    <strong style={{ color: '#FBBC05' }}>
                      {order.deliveryDue}
                    </strong>
                  </div>
                  {order.photoNumber && (
                    <span
                      className="inline-block text-[9.5px] font-mono font-black px-2 py-0.5 rounded-md border"
                      style={{
                        backgroundColor: '#6E473B',
                        color: '#E1D4C2',
                        borderColor: '#A78D78',
                      }}
                    >
                      📸 {order.photoNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Itemized Order Breakdown Table */}
              <div
                className="rounded-2xl overflow-hidden border text-xs"
                style={{
                  borderColor: theme === 'cream_ivory' ? '#BEB5A9' : '#6E473B',
                  backgroundColor: theme === 'cream_ivory' ? '#FFFFFF' : '#1A1208',
                }}
              >
                <div
                  className="px-3.5 py-2 font-black text-[10px] uppercase tracking-wider grid grid-cols-12"
                  style={{
                    backgroundColor: '#6E473B',
                    color: '#E1D4C2',
                  }}
                >
                  <div className="col-span-6">Service / Package</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div
                  className="divide-y"
                  style={{
                    borderColor: theme === 'cream_ivory' ? '#E1D4C2' : '#291C0E',
                  }}
                >
                  <div className="px-3.5 py-2.5 grid grid-cols-12 items-center text-[11.5px]">
                    <div className="col-span-6 font-bold">
                      <div
                        style={{
                          color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                        }}
                      >
                        {order.serviceTitle}
                      </div>
                      {order.isUrgent && (
                        <span
                          className="inline-block text-[9px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5"
                          style={{
                            backgroundColor: '#EA4335',
                            color: '#FFFFFF',
                          }}
                        >
                          ⚡ Express Urgent
                        </span>
                      )}
                    </div>
                    <div
                      className="col-span-2 text-center font-bold"
                      style={{
                        color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78',
                      }}
                    >
                      {order.passportSpecs?.quantity || 1}
                    </div>
                    <div
                      className="col-span-2 text-right font-mono"
                      style={{
                        color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78',
                      }}
                    >
                      {formatCurrency(order.pricing.basePackagePrice)}
                    </div>
                    <div
                      className="col-span-2 text-right font-black font-mono"
                      style={{
                        color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                      }}
                    >
                      {formatCurrency(order.pricing.finalTotal + order.pricing.discount)}
                    </div>
                  </div>

                  {order.pricing.discount > 0 && (
                    <div
                      className="px-3.5 py-1.5 grid grid-cols-12 text-[10.5px]"
                      style={{
                        backgroundColor: '#6E473B',
                        color: '#E1D4C2',
                      }}
                    >
                      <div className="col-span-10 font-bold flex items-center gap-1">
                        <span>🏷️ Special Studio Concession / Discount</span>
                      </div>
                      <div className="col-span-2 text-right font-bold font-mono">
                        - {formatCurrency(order.pricing.discount)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Hero Settlement & Google Pay QR Box */}
              <div className="grid grid-cols-12 gap-3 pt-1">
                {/* Authentic Google Pay QR Card in Swatch Palette */}
                <div
                  className="col-span-5 p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center"
                  style={
                    theme === 'cream_ivory'
                      ? {
                          backgroundColor: '#FFFFFF',
                          borderColor: '#BEB5A9',
                        }
                      : {
                          backgroundColor: '#1E140A',
                          borderColor: '#6E473B',
                        }
                  }
                >
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col items-center">
                    <QRCodeSVG
                      value={upiPaymentUri}
                      size={76}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="mt-1.5 w-full">
                    <span
                      className="text-[9px] font-black uppercase tracking-wider block"
                      style={{ color: '#6E473B' }}
                    >
                      Google Pay / UPI
                    </span>
                    <span
                      className="text-[8px] font-mono font-bold block truncate max-w-full"
                      style={{
                        color: theme === 'cream_ivory' ? '#291C0E' : '#E1D4C2',
                      }}
                    >
                      {upiId}
                    </span>
                    <span
                      className="text-[7px] font-semibold block mt-0.5"
                      style={{
                        color: theme === 'cream_ivory' ? '#A78D78' : '#BEB5A9',
                      }}
                    >
                      GPay &bull; PhonePe &bull; Paytm &bull; BHIM
                    </span>
                  </div>
                </div>

                {/* Settlement Calculation Details */}
                <div
                  className="col-span-7 p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 shadow-xs"
                  style={
                    theme === 'cream_ivory'
                      ? {
                          backgroundColor: '#291C0E',
                          color: '#E1D4C2',
                          borderColor: '#6E473B',
                        }
                      : {
                          backgroundColor: '#1A1208',
                          color: '#E1D4C2',
                          borderColor: '#6E473B',
                        }
                  }
                >
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between" style={{ color: '#BEB5A9' }}>
                      <span>Total Amount:</span>
                      <strong
                        className="font-black font-mono text-xs"
                        style={{ color: '#E1D4C2' }}
                      >
                        {formatCurrency(order.pricing.finalTotal)}
                      </strong>
                    </div>

                    <div className="flex justify-between" style={{ color: '#BEB5A9' }}>
                      <span>Advance Received:</span>
                      <strong
                        className="font-bold font-mono"
                        style={{ color: '#34A853' }}
                      >
                        {formatCurrency(order.payment.advancePaid)}
                        {isSplit && ' (Split)'}
                      </strong>
                    </div>

                    {isSplit && order.payment.splitDetails && (
                      <div
                        className="text-[9.5px] px-2 py-0.5 rounded font-mono flex justify-between border"
                        style={{
                          backgroundColor: '#291C0E',
                          color: '#BEB5A9',
                          borderColor: '#6E473B',
                        }}
                      >
                        <span>💵 Cash: ₹{order.payment.splitDetails.cashAmount}</span>
                        <span>📱 UPI: ₹{order.payment.splitDetails.onlineAmount}</span>
                      </div>
                    )}
                  </div>

                  <div
                    className="border-t pt-2"
                    style={{ borderColor: '#6E473B' }}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className="text-[11px] font-black uppercase tracking-wider"
                        style={{ color: '#A78D78' }}
                      >
                        {isFullyPaid ? 'Status:' : 'Balance Due:'}
                      </span>
                      <strong
                        className="text-base font-black font-mono"
                        style={{
                          color: isFullyPaid ? '#34A853' : '#EA4335',
                        }}
                      >
                        {isFullyPaid ? 'PAID IN FULL ✓' : formatCurrency(balanceDue)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Seal & Footer */}
              <div
                className="pt-2 border-t flex items-center justify-between text-[10px] font-medium"
                style={{
                  borderColor: theme === 'cream_ivory' ? '#BEB5A9' : '#6E473B',
                  color: theme === 'cream_ivory' ? '#6E473B' : '#A78D78',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#34A853' }} />
                  <span className="text-[9px]">Verified Studio Receipt &bull; Mansa</span>
                </div>
                <div className="flex items-center gap-1 font-extrabold text-xs tracking-wide">
                  <span>Visit Again !</span>
                  <Smile className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 stroke-[2.2]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download 3x Ultra-HD PNG"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              ) : (
                <Download className="w-4 h-4 text-amber-400" />
              )}
              <span>HD PNG</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              title="Copy HD Image for WhatsApp"
            >
              {copySuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-indigo-400" />
              )}
              <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* ⭐ Dedicated Direct Google Review WhatsApp Button */}
            <button
              onClick={handleSendGoogleReviewWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Send Direct 5-Star Google Review Link to Client WhatsApp"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>⭐ Google Review</span>
            </button>

            {/* ⚡ Direct Send Bill Photo to WhatsApp */}
            <button
              onClick={handleShareOnWhatsApp}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              style={{
                background: 'linear-gradient(to right, #34A853, #25D366)',
              }}
              title="Direct Send Bill Photo with UPI QR Code to Client WhatsApp"
            >
              <Send className="w-4 h-4 stroke-[2.5] text-slate-950" />
              <span>⚡ Direct Send Bill Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
