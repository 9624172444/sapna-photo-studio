import React, { useState, useRef } from 'react';
import {
  ServiceCategory,
  PassportSpecs,
  BabyShootSpecs,
  MobilePrintSpecs,
  PaymentMode,
  UpiApp,
  StudioOrder,
} from '../../types';
import { useStudio } from '../../context/StudioContext';
import { InvoicePrintModal } from '../billing/InvoicePrintModal';
import { WhatsAppImageInvoiceModal } from '../billing/WhatsAppImageInvoiceModal';
import { buildInvoiceWhatsAppText } from '../../services/whatsappService';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  X,
  Camera,
  Image,
  Baby,
  Sparkles,
  Phone,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ArrowLeft,
  Search,
  Check,
  Send,
  MessageSquare,
  Palette,
  Tag,
  Download,
  Copy,
  Smile,
  ShieldCheck,
  Loader2,
  ExternalLink,
  QrCode,
  Maximize2,
} from 'lucide-react';

interface CounterBookingModalProps {
  onClose: () => void;
  onOrderCreated?: (order: StudioOrder) => void;
}

export const CounterBookingModal: React.FC<CounterBookingModalProps> = ({
  onClose,
  onOrderCreated,
}) => {
  const {
    createOrder,
    findCustomerByMobile,
    services,
    packages,
    framePrices,
    laminationOptions,
    printOnlyPrices,
    profile,
    formatCurrency,
    currentRole,
  } = useStudio();

  // Wizard Step: 1 = Service Select, 2 = Customer & Details, 3 = Pricing & Advance, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdOrder, setCreatedOrder] = useState<StudioOrder | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const successCardRef = useRef<HTMLDivElement>(null);

  // Service Selection
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('passport_visa');

  // Customer Details
  const [mobileNumber, setMobileNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [customerHistory, setCustomerHistory] = useState<{ isExisting: boolean; totalVisits: number; pastOrders: StudioOrder[] }>({
    isExisting: false,
    totalVisits: 0,
    pastOrders: [],
  });

  // Photo Intake: Camera DSC / WhatsApp Image / Scan Image / USB
  const [photoSource, setPhotoSource] = useState<'camera' | 'whatsapp' | 'scan' | 'usb'>('camera');
  const [photoNumber, setPhotoNumber] = useState('');
  
  // Delivery Schedule Dates (Urgent Today, Tomorrow, or Custom Calendar)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [deliveryOption, setDeliveryOption] = useState<'urgent_today' | 'tomorrow' | 'custom'>('urgent_today');
  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr);

  // A. Passport & Visa Packages (loaded dynamically from packages master)
  const [selectedPackageId, setSelectedPackageId] = useState<string>('PKG-PASS-12');
  const [passportCountry, setPassportCountry] = useState('Indian Passport');
  const [passportSize, setPassportSize] = useState('35x45 mm');
  const [passportBg, setPassportBg] = useState<'White' | 'Blue' | 'Grey'>('White');
  const [passportAttire, setPassportAttire] = useState<'original' | 'suit'>('original');
  const [orderDescription, setOrderDescription] = useState('');
  const [passportQty, setPassportQty] = useState(12);
  const [passportDeliveryTime, setPassportDeliveryTime] = useState('Urgent (10 Mins)');
  const [passportPrice, setPassportPrice] = useState(100);

  // B. Baby Shoot Specs
  const [babyName, setBabyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [babyAge, setBabyAge] = useState('1 Year (1st Birthday)');
  const [babyOccasion, setBabyOccasion] = useState('1st Birthday Cake Smash');
  const [babyPackage, setBabyPackage] = useState<'basic' | 'standard' | 'premium' | 'custom'>('standard');
  const [babyDate, setBabyDate] = useState(new Date().toISOString().split('T')[0]);
  const [babyPrice, setBabyPrice] = useState(450);

  // C. Framing & Print Specs (loaded from framePrices & printOnlyPrices master)
  const [selectedFrameId, setSelectedFrameId] = useState<string>(framePrices[2]?.id || 'FRM-8x12');
  const [selectedFrameType, setSelectedFrameType] = useState<'vel' | 'royal'>('royal');
  const [selectedLaminationId, setSelectedLaminationId] = useState<string>('LAM-NORMAL');
  const [selectedPrintOnlyId, setSelectedPrintOnlyId] = useState<string>('PRT-8x12');
  const [mobileSource, setMobileSource] = useState<'whatsapp' | 'mobile' | 'usb'>('whatsapp');
  const [frameOrderType, setFrameOrderType] = useState<'frame' | 'print_only'>('frame');
  const [printQty, setPrintQty] = useState(1);
  const [editingRequired, setEditingRequired] = useState(true);

  // D. Other / Custom Shoot Specs
  const [customTitle, setCustomTitle] = useState('Studio Photography Session');
  const [customPrice, setCustomPrice] = useState(3500);

  // Advance Payment & Discounts
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [upiApp, setUpiApp] = useState<UpiApp>('gpay');

  // Split Payment (Part Cash + Part Online / UPI)
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitOnline, setSplitOnline] = useState<number>(0);
  const [splitUpiApp, setSplitUpiApp] = useState<UpiApp>('gpay');

  // Handle mobile number auto lookup
  const handleMobileChange = (mobile: string) => {
    setMobileNumber(mobile);
    if (mobile.replace(/[^0-9]/g, '').length >= 10) {
      const { customer, orderHistory } = findCustomerByMobile(mobile);
      if (customer) {
        setClientName(customer.name);
        setWhatsappNumber(customer.whatsapp || customer.mobile);
        setAddress(customer.address || '');
        setCustomerHistory({
          isExisting: true,
          totalVisits: customer.totalVisits,
          pastOrders: orderHistory,
        });
      } else {
        setCustomerHistory({ isExisting: false, totalVisits: 0, pastOrders: [] });
      }
    }
  };

  const calculateSubtotal = () => {
    let base = 0;
    if (selectedCategory === 'passport_visa') {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      base = pkg ? pkg.price : passportPrice;
    } else if (selectedCategory === 'baby_photoshoot') {
      const pkg = packages.find((p) => p.id === 'PKG-MODEL-68');
      base = pkg ? pkg.price : babyPrice;
    } else if (selectedCategory === 'mobile_print_frame') {
      if (frameOrderType === 'frame') {
        const frm = framePrices.find((f) => f.id === selectedFrameId);
        const frameCost = frm ? (selectedFrameType === 'vel' ? frm.velFramePrice : frm.royalFramePrice) : 850;
        const lam = laminationOptions.find((l) => l.id === selectedLaminationId);
        const lamCost = lam ? lam.surcharge : 0;
        base = (frameCost + lamCost) * (printQty || 1);
      } else {
        const prt = printOnlyPrices.find((p) => p.id === selectedPrintOnlyId);
        base = (prt ? prt.price : 400) * (printQty || 1);
      }
    } else {
      base = customPrice;
    }
    return base;
  };

  const grossSubtotal = calculateSubtotal();
  const effectiveDiscount = Math.min(grossSubtotal, Math.max(0, Number(discountAmount) || 0));
  const netFinalTotal = Math.max(0, grossSubtotal - effectiveDiscount);
  const effectivePaidNow =
    paymentMode === 'split'
      ? Math.max(0, Number(splitCash || 0) + Number(splitOnline || 0))
      : Math.max(0, Number(advanceAmount || 0));
  const balanceDue = Math.max(0, netFinalTotal - effectivePaidNow);

  // Direct Send Bill Photo to Client WhatsApp
  const handleDirectSendBillPhoto = async (order: StudioOrder) => {
    if (!successCardRef.current) return;
    
    // Normalize phone number (auto-prefix India 91 if 10 digits)
    let rawPhone = (order.whatsappNumber || order.mobileNumber || '').replace(/[^0-9]/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    try {
      setIsGeneratingCard(true);
      const blob = await toBlob(successCardRef.current, { cacheBust: true, pixelRatio: 3 });
      
      if (blob) {
        const fileName = `Sapna_Photo_Studio_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;

        // Copy to Clipboard for instant Ctrl+V / Paste in WhatsApp
        if (navigator.clipboard && (window as any).ClipboardItem) {
          try {
            await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
          } catch (clipErr) {
            console.warn('Clipboard write failed:', clipErr);
          }
        }
      }
    } catch (err) {
      console.warn('Image generation error:', err);
    } finally {
      setIsGeneratingCard(false);
    }

    // Direct WhatsApp Chat Link (with 91 country code, no extra text)
    const whatsappUrl = `https://wa.me/${phone}`;
    window.open(whatsappUrl, '_blank');
    setStatusToast('🚀 WhatsApp Opened! Bill Photo is copied to your clipboard — Press Ctrl+V in WhatsApp to send!');
    setTimeout(() => setStatusToast(null), 8000);
  };

  // Direct Copy Bill Photo to Clipboard
  const handleCopyBillPhoto = async () => {
    if (!successCardRef.current) return;
    try {
      setIsGeneratingCard(true);
      const blob = await toBlob(successCardRef.current, { cacheBust: true, pixelRatio: 3 });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([new (window as any).ClipboardItem({ 'image/png': blob })]);
        setCopySuccess(true);
        setStatusToast('📋 Bill photo copied to clipboard! Press Ctrl+V in WhatsApp to paste!');
        setTimeout(() => {
          setCopySuccess(false);
          setStatusToast(null);
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Direct Download Bill Photo
  const handleDownloadBillPhoto = async (order: StudioOrder) => {
    if (!successCardRef.current) return;
    try {
      setIsGeneratingCard(true);
      const dataUrl = await toPng(successCardRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `Sapna_Photo_Studio_${order.invoiceNumber}_${order.clientName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      setStatusToast('📥 HD Bill PNG downloaded to your computer!');
      setTimeout(() => setStatusToast(null), 4000);
    } catch (err) {
      console.error('Failed to download image:', err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Direct Google Review WhatsApp Action
  const handleDirectGoogleReview = async (order: StudioOrder) => {
    const phone = (order.whatsappNumber || order.mobileNumber).replace(/[^0-9]/g, '');
    const googleReviewLink = profile.googleReviewUrl || 'https://g.page/r/CUXYuMGkSffgEAI/review';
    const reviewText = `Hello *${order.clientName}*! :)\n\nThank you for choosing *${profile.name}, Mansa* for your *${order.serviceTitle}*.\n\n★ *Loved our photography & service?*\nKindly take 30 seconds to share your 5-star Google Review here:\n→ ${googleReviewLink}\n\nThank you & Visit Again ! :)`;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(reviewText);
      }
    } catch (e) {}

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(reviewText)}`;
    window.open(whatsappUrl, '_blank');
    setStatusToast('⭐ Google Review request opened in WhatsApp!');
    setTimeout(() => setStatusToast(null), 5000);
  };

  // Submit Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || !clientName) {
      alert('Please enter client name and mobile number');
      return;
    }

    let serviceTitle = '';
    let passportSpecsData: PassportSpecs | undefined;
    let babySpecsData: BabyShootSpecs | undefined;
    let mobilePrintSpecsData: MobilePrintSpecs | undefined;

    let initialCameraPhotos = 0;
    let initialSelected = 1;
    let includedPhotos = 1;

    if (selectedCategory === 'passport_visa') {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      const pkgName = pkg ? pkg.name : `Passport Photo (${passportQty} Copies)`;
      const pkgSize = pkg ? pkg.size : passportSize;
      const pkgCopies = pkg ? pkg.copies : passportQty;
      const pkgRate = pkg ? pkg.price : passportPrice;

      serviceTitle = `${pkgName} - ${pkgSize}`;
      passportSpecsData = {
        countryOrType: passportCountry,
        photoSize: pkgSize,
        backgroundColor: passportBg,
        attireType: passportAttire,
        quantity: pkgCopies,
        deliveryTime: deliveryOption === 'urgent_today' ? 'Urgent (10-15 Mins)' : deliveryOption === 'tomorrow' ? 'Tomorrow' : `Date: ${deliveryDate}`,
        price: pkgRate,
        photoNumber: photoNumber.trim() || undefined,
      };
      initialCameraPhotos = 4;
      initialSelected = 1;
      includedPhotos = 1;
    } else if (selectedCategory === 'baby_photoshoot') {
      serviceTitle = `Modeling / Child Shoot (${babyOccasion || 'Studio Shoot'})`;
      babySpecsData = {
        babyName: babyName || clientName,
        parentName: parentName || clientName,
        babyAge,
        occasion: babyOccasion,
        photoshootDate: babyDate,
        packageType: 'standard',
        packageName: `Modeling & Child Photography (100 Prints)`,
        themesCount: 2,
      };
      initialCameraPhotos = 45;
      initialSelected = 100;
      includedPhotos = 100;
    } else if (selectedCategory === 'mobile_print_frame') {
      const frm = framePrices.find((f) => f.id === selectedFrameId);
      if (frameOrderType === 'frame') {
        serviceTitle = `Framing: ${frm?.size || '8x12'} (${selectedFrameType === 'vel' ? 'Vel Frame' : 'Royal Frame'})`;
        mobilePrintSpecsData = {
          source: mobileSource,
          printSize: frm?.size || '8x12',
          frameSize: frm?.size || '8x12',
          frameType: selectedFrameType === 'vel' ? 'Vel Frame' : 'Royal Frame',
          quantity: printQty,
          editingRequired: true,
          laminationRequired: selectedLaminationId === 'LAM-HQ',
        };
      } else {
        const prt = printOnlyPrices.find((p) => p.id === selectedPrintOnlyId);
        serviceTitle = `Print Only: ${prt?.size || 'Photo Print'}`;
        mobilePrintSpecsData = {
          source: mobileSource,
          printSize: prt?.size || '8x12',
          quantity: printQty,
          editingRequired: prt?.editingType === 'editing',
        };
      }
      initialCameraPhotos = 1;
      initialSelected = 1;
      includedPhotos = 1;
    } else {
      serviceTitle = customTitle;
      initialCameraPhotos = 30;
      initialSelected = 10;
      includedPhotos = 10;
    }

    const isUrgent = deliveryOption === 'urgent_today' || deliveryDate === todayStr;

    const newOrder = createOrder({
      customerId: `CUST-${Date.now()}`,
      clientName: clientName.trim(),
      mobileNumber: mobileNumber.trim(),
      whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
      address: address.trim(),
      customerType: customerHistory.isExisting ? 'existing' : 'new',
      serviceCategory: selectedCategory,
      serviceTitle,
      passportSpecs: passportSpecsData,
      babySpecs: babySpecsData,
      mobilePrintSpecs: mobilePrintSpecsData,
      photoshootId: `PS-${Date.now()}`,
      photoSource,
      photoNumber: photoNumber.trim() || undefined,
      photographerName: 'Studio Team',
      cameraUsed: photoSource === 'camera' ? 'Nikon Z6 II / Canon R6' : photoSource.toUpperCase(),
      photoshootDate: selectedCategory === 'baby_photoshoot' ? babyDate : new Date().toISOString().split('T')[0],
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      photoCount: {
        cameraPhotosTaken: initialCameraPhotos,
        clientSelected: initialSelected,
        rejected: 0,
        extraSelected: 0,
        extraPhotoRate: 100,
        photosEdited: 0,
        finalDelivered: 0,
      },
      status: 'new_order',
      pricing: {
        basePackagePrice: grossSubtotal,
        includedPhotos,
        extraPhotoRate: 100,
        extraPhotoTotal: 0,
        printCharges: 0,
        frameCharges: 0,
        laminationCharges: 0,
        customCharges: 0,
        subtotal: grossSubtotal,
        discount: effectiveDiscount,
        taxAmount: 0,
        finalTotal: netFinalTotal,
      },
      payment: {
        totalAmount: netFinalTotal,
        advancePaid: Math.min(netFinalTotal, effectivePaidNow),
        balanceDue,
        status: effectivePaidNow >= netFinalTotal ? 'fully_paid' : effectivePaidNow > 0 ? 'partially_paid' : 'unpaid',
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
        transactionRef: `REC-${Date.now()}`,
      },
      deliveryDue: deliveryDate || todayStr,
      createdBy: `${currentRole.toUpperCase()} User`,
      updatedBy: `${currentRole.toUpperCase()} User`,
      notes: `${isUrgent ? '⚡ URGENT DELIVERY • ' : ''}${deliveryOption === 'tomorrow' ? '📅 TOMORROW DELIVERY • ' : ''}${passportAttire === 'suit' ? '👔 Digital Suit / Coat • ' : ''}${orderDescription ? `Note: ${orderDescription} • ` : ''}${photoNumber ? `Photo No: ${photoNumber} • ` : ''}${effectiveDiscount > 0 ? `Discount: ₹${effectiveDiscount} (${discountReason || 'Special Offer'}) • ` : ''}${paymentMode === 'split' ? `Split Paid (Cash: ₹${splitCash} + Online: ₹${splitOnline}) • ` : ''}${address ? `Address: ${address}` : ''}${customerHistory.isExisting ? `Returning client (${customerHistory.totalVisits} visits)` : 'Walk-in client'}`,
    });

    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

    setCreatedOrder(newOrder);
    setStep(4);

    if (onOrderCreated) {
      onOrderCreated(newOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-backdrop">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 text-left my-auto animate-popup">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-1 bg-white border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img src="/sapna_logo.png" alt="Sapna Photo Studio Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  Counter Booking
                </h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {profile.name}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-400 font-medium">
                📍 Mansa &bull; &ldquo;Welcome! How can I help you?&rdquo;
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

        {/* Step Progress Tracker */}
        {step < 4 && (
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] sm:text-xs overflow-x-auto no-scrollbar">
            <div className={`flex items-center gap-1.5 font-bold shrink-0 ${step >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] sm:text-[11px]">1</span>
              <span>Select Service</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
            <div className={`flex items-center gap-1.5 font-bold shrink-0 ${step >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] ${step >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>2</span>
              <span>Client & Details</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-1" />
            <div className={`flex items-center gap-1.5 font-bold shrink-0 ${step >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
              <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] ${step >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>3</span>
              <span>Pricing & Advance</span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-6 max-h-[78vh] sm:max-h-[75vh] overflow-y-auto">
          {/* STEP 1: SERVICE CATEGORY SELECTION */}
          {step === 1 && (
            <div className="space-y-3 sm:space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                What service does the client need today?
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Passport / Visa Option */}
                <div
                  onClick={() => {
                    setSelectedCategory('passport_visa');
                    setPassportPrice(100);
                    setPassportQty(12);
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    selectedCategory === 'passport_visa'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Urgent Passport / Visa / ID Photo
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      12 Copies (₹100) &bull; 24 Copies (₹150) &bull; 48 Copies (₹250) &bull; 96 Copies (₹500)
                    </p>
                    <span className="inline-block mt-2 font-extrabold text-xs text-amber-600 dark:text-amber-400">
                      12 Copies @ ₹100 &rarr;
                    </span>
                  </div>
                </div>

                {/* Baby Photoshoot Option */}
                <div
                  onClick={() => {
                    setSelectedCategory('baby_photoshoot');
                    setBabyPrice(4500);
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    selectedCategory === 'baby_photoshoot'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <Baby className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Baby Photoshoot
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Theme Setups, Cake Smash, 45+ camera shots, edited photos & frame
                    </p>
                    <span className="inline-block mt-2 font-extrabold text-xs text-amber-600 dark:text-amber-400">
                      From ₹2,500 &rarr;
                    </span>
                  </div>
                </div>

                {/* Mobile Photo to Print / Frame */}
                <div
                  onClick={() => {
                    setSelectedCategory('mobile_print_frame');
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    selectedCategory === 'mobile_print_frame'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Mobile Photo Print & Frame
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct WhatsApp / USB photo to Lab Glossy Print & Vel/Royal Framing
                    </p>
                    <span className="inline-block mt-2 font-extrabold text-xs text-amber-600 dark:text-amber-400">
                      From ₹100 &rarr;
                    </span>
                  </div>
                </div>

                {/* Other Studio Shoots */}
                <div
                  onClick={() => {
                    setSelectedCategory('family_photoshoot');
                    setCustomPrice(5000);
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    selectedCategory === 'family_photoshoot'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Modeling / Event / Matrimonial
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Studio portrait portfolio, Matrimonial biodata shoots, ceremonies
                    </p>
                    <span className="inline-block mt-2 font-extrabold text-xs text-amber-600 dark:text-amber-400">
                      Custom Studio Package &rarr;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CLIENT & ORDER SPECS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. Customer Information */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>Customer Details</span>
                  </h4>
                  {customerHistory.isExisting && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ✓ Existing Client ({customerHistory.totalVisits} visits)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Mobile Number (WhatsApp) *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Client Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Client Full Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC SERVICE CONFIGURATION */}
              {/* Passport & Visa Package Selection */}
              {selectedCategory === 'passport_visa' && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Passport / Visa Package (Zero Hardcoding)</span>
                    </h4>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-500/20 px-2 py-0.5 rounded-md">
                      Price Master Catalog
                    </span>
                  </div>

                  {/* Package Selector Chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      Select Package / Quantity
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {packages
                        .filter((p) => p.serviceCategory === 'passport_visa' && p.active)
                        .map((pkg) => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => {
                              setSelectedPackageId(pkg.id);
                              setPassportPrice(pkg.price);
                              setPassportQty(pkg.copies);
                              setPassportSize(pkg.size);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                              selectedPackageId === pkg.id
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                            }`}
                          >
                            <span className="text-xs font-black block">{pkg.name}</span>
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block mt-0.5">
                              {formatCurrency(pkg.price)}
                            </span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 block">
                              {pkg.size}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Background Color</label>
                      <select
                        value={passportBg}
                        onChange={(e) => setPassportBg(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="White">⚪ White (Standard)</option>
                        <option value="Blue">🔵 Light Blue</option>
                        <option value="Grey">🔘 Grey</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Country / Requirement</label>
                      <input
                        type="text"
                        value={passportCountry}
                        onChange={(e) => setPassportCountry(e.target.value)}
                        placeholder="e.g. Indian Passport, US Visa 2x2"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Suit / Original Cloth Tick Mark Selector */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Clothing / Attire Requirement</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${passportAttire === 'suit' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {passportAttire === 'suit' ? '👔 Digital Suit / Coat' : '👕 Original Cloth'}
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPassportAttire('original')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          passportAttire === 'original'
                            ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">👕</span>
                          <div>
                            <span className="text-xs font-black block">Original Cloth</span>
                            <span className="text-[9px] opacity-80 block">As captured in shoot</span>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-black ${passportAttire === 'original' ? 'bg-slate-950 text-amber-400 border-slate-950' : 'border-slate-400 text-transparent'}`}>
                          ✓
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPassportAttire('suit')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          passportAttire === 'suit'
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">👔</span>
                          <div>
                            <span className="text-xs font-black block">Suit / Coat Change</span>
                            <span className="text-[9px] opacity-80 block">Photoshop Coat & Tie</span>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-black ${passportAttire === 'suit' ? 'bg-white text-indigo-600 border-white' : 'border-slate-400 text-transparent'}`}>
                          ✓
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Description / Special Instructions Box */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                      <span>Description / Editing Instructions</span>
                      <span className="text-[9px] text-slate-400 font-normal">Optional note for photographer & lab</span>
                    </label>
                    <input
                      type="text"
                      value={orderDescription}
                      onChange={(e) => setOrderDescription(e.target.value)}
                      placeholder="e.g. Black suit with red tie, remove glasses, pimple retouch, white collar..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[
                        '👔 Black Suit & Tie',
                        '👔 Navy Blazer',
                        '👕 White Shirt Only',
                        '👓 Remove Glasses',
                        '✨ Face Clean / Retouch',
                        '📅 Add Date on Photo',
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const cleanText = tag.replace(/^[^\w\s]+/, '').trim();
                            setOrderDescription((prev) => (prev ? `${prev}, ${cleanText}` : cleanText));
                            if (tag.includes('Suit') || tag.includes('Blazer')) {
                              setPassportAttire('suit');
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-500/20 text-slate-600 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 text-[10px] font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Print & Framing Configurator */}
              {selectedCategory === 'mobile_print_frame' && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-purple-600" />
                      <span>Framing & Print Configurator</span>
                    </h4>
                    {/* Toggle between Frame vs Print Only */}
                    <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-purple-200 dark:border-slate-700 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setFrameOrderType('frame')}
                        className={`px-2 py-1 rounded-md transition ${frameOrderType === 'frame' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
                      >
                        Photo + Frame
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrameOrderType('print_only')}
                        className={`px-2 py-1 rounded-md transition ${frameOrderType === 'print_only' ? 'bg-purple-600 text-white' : 'text-slate-500'}`}
                      >
                        Print Only
                      </button>
                    </div>
                  </div>

                  {frameOrderType === 'frame' ? (
                    <div className="space-y-3 pt-1">
                      {/* Frame Type (Vel vs Royal) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedFrameType('royal')}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            selectedFrameType === 'royal'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-extrabold block">👑 Royal Frame</span>
                          <span className="text-[10px] text-slate-400">Premium ornate border frame</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedFrameType('vel')}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            selectedFrameType === 'vel'
                              ? 'bg-purple-500/20 border-purple-500 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-xs font-extrabold block">🖼️ Vel Frame</span>
                          <span className="text-[10px] text-slate-400">Velvet textured classic</span>
                        </button>
                      </div>

                      {/* Frame Size Selector (Matrix) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Select Frame Size (From Frame Master)
                          </label>
                          <span className="text-[10px] text-purple-600 font-bold">
                            {selectedFrameType === 'vel' ? '🖼️ Velvet Frame' : '👑 Royal Frame'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {framePrices
                            .filter((f) => f.active)
                            .map((f) => {
                              const price = selectedFrameType === 'vel' ? f.velFramePrice : f.royalFramePrice;
                              if (price <= 0) return null;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => setSelectedFrameId(f.id)}
                                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                    selectedFrameId === f.id
                                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-bold'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                                  }`}
                                >
                                  <span className="text-xs font-black block">{f.size}</span>
                                  <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 block mt-0.5">
                                    {formatCurrency(price)}
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {/* Quantity & Lamination */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Number of Frame Copies
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={printQty}
                              onChange={(e) => setPrintQty(Math.max(1, Number(e.target.value)))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                            />
                            <div className="flex gap-1 shrink-0">
                              {[1, 2, 3, 5].map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => setPrintQty(q)}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                    printQty === q
                                      ? 'bg-purple-600 text-white border-purple-700'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                                  }`}
                                >
                                  {q}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Lamination Selector */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Lamination Finishing
                          </label>
                          <select
                            value={selectedLaminationId}
                            onChange={(e) => setSelectedLaminationId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {laminationOptions.map((lam) => (
                              <option key={lam.id} value={lam.id}>
                                {lam.name} {lam.surcharge > 0 ? `(+₹${lam.surcharge})` : '(Included)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Print Only Selector */
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Select Print Size (From Print Master)
                          </label>
                          <span className="text-[10px] text-indigo-600 font-bold">Lab Glossy Print</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {printOnlyPrices
                            .filter((p) => p.active)
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPrintOnlyId(p.id)}
                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                  selectedPrintOnlyId === p.id
                                    ? 'bg-purple-600 text-white border-purple-700 shadow-md font-bold'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                                }`}
                              >
                                <span className="text-xs font-black block">{p.size}</span>
                                <span className={`text-[11px] font-extrabold block mt-0.5 ${selectedPrintOnlyId === p.id ? 'text-purple-100' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                  {formatCurrency(p.price)}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Print Quantity */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Print Quantity
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={printQty}
                            onChange={(e) => setPrintQty(Math.max(1, Number(e.target.value)))}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          />
                          <div className="flex gap-1 shrink-0">
                            {[1, 2, 5, 10, 20].map((q) => (
                              <button
                                key={q}
                                type="button"
                                onClick={() => setPrintQty(q)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                  printQty === q
                                    ? 'bg-purple-600 text-white border-purple-700'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                                }`}
                              >
                                {q}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DELIVERY SCHEDULE: URGENT (TODAY), TOMORROW, OR CALENDAR DATE PICKER */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Delivery Date & Urgency</span>
                  </h4>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    Promised: {deliveryDate}
                  </span>
                </div>

                {/* 3 Choice Buttons: Urgent Today, Tomorrow, Calendar Custom */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryOption('urgent_today');
                      setDeliveryDate(todayStr);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      deliveryOption === 'urgent_today'
                        ? 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                    }`}
                  >
                    <span className="text-sm">⚡ 🔴</span>
                    <span className="text-xs font-black">Urgent (Today)</span>
                    <span className="text-[9px] text-slate-500">Same-Day Express</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryOption('tomorrow');
                      setDeliveryDate(tomorrowStr);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      deliveryOption === 'tomorrow'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-sm">📅</span>
                    <span className="text-xs font-black">Tomorrow</span>
                    <span className="text-[9px] text-slate-500">{tomorrowStr}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryOption('custom')}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      deliveryOption === 'custom'
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    <span className="text-sm">🗓️</span>
                    <span className="text-xs font-black">Select Date</span>
                    <span className="text-[9px] text-slate-500">Custom Calendar</span>
                  </button>
                </div>

                {/* Calendar Date Picker Input */}
                <div className="pt-1">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={deliveryDate}
                      min={todayStr}
                      onChange={(e) => {
                        setDeliveryDate(e.target.value);
                        if (e.target.value === todayStr) {
                          setDeliveryOption('urgent_today');
                        } else if (e.target.value === tomorrowStr) {
                          setDeliveryOption('tomorrow');
                        } else {
                          setDeliveryOption('custom');
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* PHOTO / IMAGE INTAKE SOURCE (Camera, WhatsApp, Scan Image, USB) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>Photo Intake Source & File Reference</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                    {photoSource === 'camera'
                      ? '📸 Studio Camera'
                      : photoSource === 'whatsapp'
                      ? '📱 WhatsApp Image'
                      : photoSource === 'scan'
                      ? '🖼️ Scan Image'
                      : '💾 USB / Drive'}
                  </span>
                </div>

                {/* Source Selection Segmented Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-amber-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource('camera');
                      if (!photoNumber || photoNumber.startsWith('WA_') || photoNumber.startsWith('SCAN_')) {
                        setPhotoNumber('DSC_');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      photoSource === 'camera'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>📸 Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource('whatsapp');
                      if (!photoNumber || photoNumber.startsWith('DSC_') || photoNumber.startsWith('SCAN_')) {
                        setPhotoNumber(`WA_${mobileNumber || 'IMG'}`);
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      photoSource === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>📱 WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource('scan');
                      if (!photoNumber || photoNumber.startsWith('DSC_') || photoNumber.startsWith('WA_')) {
                        setPhotoNumber('SCAN_01');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      photoSource === 'scan'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🖼️ Scan Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource('usb');
                      if (!photoNumber || photoNumber.startsWith('DSC_') || photoNumber.startsWith('WA_') || photoNumber.startsWith('SCAN_')) {
                        setPhotoNumber('USB_FILE');
                      }
                    }}
                    className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer ${
                      photoSource === 'usb'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>💾 Pen Drive</span>
                  </button>
                </div>

                {/* Dynamic Input based on Source */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      photoSource === 'camera'
                        ? 'e.g. DSC_4092, Frame #4, Roll-12...'
                        : photoSource === 'whatsapp'
                        ? 'e.g. WhatsApp Image / File Name / WA-98250xxxxx'
                        : photoSource === 'scan'
                        ? 'e.g. SCAN-01, Old Photo Scan & Restoration, Box #3'
                        : 'e.g. Sandisk_USB / DCIM / IMG_0021'
                    }
                    value={photoNumber}
                    onChange={(e) => setPhotoNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-sm font-mono font-extrabold text-amber-700 dark:text-amber-400 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 shadow-inner"
                  />
                </div>

                {/* Quick Helper Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-500 font-semibold">Quick Tags:</span>
                  {photoSource === 'camera' &&
                    ['DSC_', 'IMG_', 'Frame #', 'P-', 'Roll-'].map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => setPhotoNumber((prev) => (prev ? `${prev}, ${prefix}` : prefix))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-amber-500/20 hover:text-amber-600 transition cursor-pointer"
                      >
                        +{prefix}
                      </button>
                    ))}

                  {photoSource === 'whatsapp' &&
                    ['WA_Doc', 'WA_Image', 'Client_WA', 'HighRes_WA'].map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => setPhotoNumber((prev) => (prev ? `${prev}_${prefix}` : prefix))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-emerald-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-mono font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                      >
                        +{prefix}
                      </button>
                    ))}

                  {photoSource === 'scan' &&
                    ['SCAN_01', 'Old_Restore', 'Hardcopy_Scan', 'Passport_Scan'].map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => setPhotoNumber((prev) => (prev ? `${prev}_${prefix}` : prefix))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-purple-300 dark:border-slate-700 text-purple-700 dark:text-purple-300 font-mono font-bold hover:bg-purple-500/20 transition cursor-pointer"
                      >
                        +{prefix}
                      </button>
                    ))}

                  {photoSource === 'usb' &&
                    ['USB_File', 'Card_Reader', 'Drive_Link', 'Bluetooth'].map((prefix) => (
                      <button
                        key={prefix}
                        type="button"
                        onClick={() => setPhotoNumber((prev) => (prev ? `${prev}_${prefix}` : prefix))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 font-mono font-bold hover:bg-indigo-500/20 transition cursor-pointer"
                      >
                        +{prefix}
                      </button>
                    ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!mobileNumber || !clientName) {
                      alert('Please enter Client Name and Mobile Number');
                      return;
                    }
                    setAdvanceAmount(
                      selectedCategory === 'passport_visa'
                        ? grossSubtotal
                        : grossSubtotal
                    );
                    setStep(3);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRICING, DISCOUNT & ADVANCE */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Order Summary & Discount... */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-500" />
                    <span>Special Discount & Concession</span>
                  </label>
                  {effectiveDiscount > 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      ✓ ₹{effectiveDiscount} OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Amount ({profile.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={grossSubtotal}
                      placeholder="0"
                      value={discountAmount || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setDiscountAmount(val);
                        const newNet = Math.max(0, grossSubtotal - val);
                        if (advanceAmount > newNet) {
                          setAdvanceAmount(newNet);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-sm font-extrabold text-amber-700 dark:text-amber-400 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Advance / Full Payment Collection (Supports Split Cash + Online) */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Collect Advance / Payment</span>
                  </h4>
                  <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                    Net Bill: {formatCurrency(netFinalTotal)}
                  </span>
                </div>

                {/* Payment Mode Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { id: 'cash', label: '💵 Cash', sub: 'Full in Hand' },
                      { id: 'upi', label: '📱 Online UPI', sub: 'GPay/PhonePe' },
                      { id: 'split', label: '⚡ Split Pay', sub: 'Cash + Online' },
                      { id: 'card', label: '💳 Card / POS', sub: 'Debit/Credit' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setPaymentMode(mode.id as PaymentMode);
                          if (mode.id === 'split') {
                            const half = Math.round(netFinalTotal / 2);
                            setSplitCash(half);
                            setSplitOnline(netFinalTotal - half);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          paymentMode === mode.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{mode.label}</span>
                        <span className={`text-[9px] block ${paymentMode === mode.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {mode.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single Payment Mode Input (Cash, UPI, Card) */}
                {paymentMode !== 'split' ? (
                  <div className="space-y-2.5">
                    {/* Quick Payment Amount Shortcuts */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Shortcuts:</span>
                      <button
                        type="button"
                        onClick={() => setAdvanceAmount(netFinalTotal)}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition cursor-pointer ${
                          advanceAmount === netFinalTotal
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-slate-700'
                        }`}
                      >
                        ⚡ Full Pay ({formatCurrency(netFinalTotal)})
                      </button>

                      {netFinalTotal >= 200 && (
                        <button
                          type="button"
                          onClick={() => setAdvanceAmount(Math.round(netFinalTotal / 2))}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
                        >
                          50% Token ({formatCurrency(Math.round(netFinalTotal / 2))})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAdvanceAmount(0)}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition cursor-pointer ${
                          advanceAmount === 0
                            ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        ₹0 (Pay on Delivery)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Amount Paid Now ({profile.currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={netFinalTotal}
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {paymentMode === 'upi' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            UPI App
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['gpay', 'phonepe', 'paytm'] as UpiApp[]).map((app) => (
                              <button
                                key={app}
                                type="button"
                                onClick={() => setUpiApp(app)}
                                className={`py-1.5 px-1 rounded-lg text-xs font-bold capitalize border transition ${
                                  upiApp === app
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {app}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* SPLIT PAYMENT (CASH + ONLINE UPI) */
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span>⚡ Split Breakdown (Cash + Online UPI)</span>
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                        Paid: {formatCurrency(effectivePaidNow)} / {formatCurrency(netFinalTotal)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Cash Part */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <label className="block text-[11px] font-extrabold text-amber-900 dark:text-amber-300 mb-1">
                          💵 Cash Portion (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={netFinalTotal}
                          value={splitCash || ''}
                          onChange={(e) => {
                            const cashVal = Math.max(0, Number(e.target.value));
                            setSplitCash(cashVal);
                          }}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 text-sm font-extrabold text-amber-700 dark:text-amber-400"
                        />
                      </div>

                      {/* Online Part */}
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                        <label className="block text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 mb-1">
                          📱 Online / UPI Portion (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={netFinalTotal}
                          value={splitOnline || ''}
                          onChange={(e) => {
                            const onlineVal = Math.max(0, Number(e.target.value));
                            setSplitOnline(onlineVal);
                          }}
                          placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-slate-700 text-sm font-extrabold text-indigo-700 dark:text-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Quick Split Helper Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick Split:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const half = Math.round(netFinalTotal / 2);
                          setSplitCash(half);
                          setSplitOnline(netFinalTotal - half);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/20"
                      >
                        50-50 Split ({formatCurrency(Math.round(netFinalTotal / 2))} each)
                      </button>

                      {netFinalTotal > 500 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSplitCash(500);
                            setSplitOnline(Math.max(0, netFinalTotal - 500));
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/20"
                        >
                          ₹500 Cash + Rest UPI
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSplitCash(100);
                          setSplitOnline(Math.max(0, netFinalTotal - 100));
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:bg-emerald-500/20"
                      >
                        ₹100 Cash + Rest UPI
                      </button>
                    </div>

                    {/* Online App Picker */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-500">Online App:</span>
                      {(['gpay', 'phonepe', 'paytm'] as UpiApp[]).map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSplitUpiApp(app)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition ${
                            splitUpiApp === app
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-emerald-500/20">
                  <span className="text-slate-600 dark:text-slate-300">Remaining Balance Due:</span>
                  <span className={`text-sm font-black ${balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {balanceDue === 0 ? '✅ ₹0 (Fully Paid)' : formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Order & Generate Bill</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CREATED SUCCESS & LIVE WHATSAPP BILL CARD */}
          {step === 4 && createdOrder && (
            <div className="space-y-4 text-center py-2 animate-in fade-in max-h-[82vh] overflow-y-auto pr-1">
              {/* Toast Banner if any */}
              {statusToast && (
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold shadow-lg animate-in slide-in-from-top-2 flex items-center justify-between gap-2 max-w-lg mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{statusToast}</span>
                  </div>
                  <button onClick={() => setStatusToast(null)} className="text-white/80 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Success Badge */}
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Order #{createdOrder.orderNumber} Created!
                </h3>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                  Total: <strong className="text-slate-900 dark:text-white">{formatCurrency(createdOrder.pricing.finalTotal)}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-400">
                  Paid: <strong>{formatCurrency(createdOrder.payment.advancePaid)}</strong>
                </span>
                <span className={`px-3 py-1 rounded-xl font-bold ${createdOrder.payment.balanceDue > 0 ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'}`}>
                  Due: <strong>{createdOrder.payment.balanceDue === 0 ? 'PAID ✓' : formatCurrency(createdOrder.payment.balanceDue)}</strong>
                </span>
              </div>

              {/* 📸 LIVE WHATSAPP LUXURY RECEIPT CARD (Exportable & Copyable) */}
              <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden shadow-xl border border-amber-900/30 text-left">
                <div
                  ref={successCardRef}
                  className="w-full text-slate-100 text-left select-none relative"
                  style={{
                    backgroundColor: '#291C0E',
                    color: '#E1D4C2',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  }}
                >
                  {/* Top 5-Color Luxury Palette Header Strip */}
                  <div className="h-1.5 w-full flex">
                    <div className="h-full w-1/5" style={{ backgroundColor: '#291C0E' }} />
                    <div className="h-full w-1/5" style={{ backgroundColor: '#6E473B' }} />
                    <div className="h-full w-1/5" style={{ backgroundColor: '#A78D78' }} />
                    <div className="h-full w-1/5" style={{ backgroundColor: '#BEB5A9' }} />
                    <div className="h-full w-1/5" style={{ backgroundColor: '#E1D4C2' }} />
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: '#6E473B' }}>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg p-0.5 bg-white border border-[#A78D78] flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img src="/sapna_logo.png" alt="Sapna Logo" className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black tracking-tight uppercase" style={{ color: '#E1D4C2' }}>
                              {profile.name}
                            </h4>
                            <p className="text-[9px] font-bold" style={{ color: '#BEB5A9' }}>
                              Photography &bull; Lab Prints &bull; Framing
                            </p>
                          </div>
                        </div>
                        <p className="text-[8.5px] font-medium" style={{ color: '#A78D78' }}>
                          📍 Station Road, Mansa &bull; 📞 {profile.phone}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className="inline-block font-mono font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider uppercase border shadow-xs"
                          style={{
                            backgroundColor: '#E1D4C2',
                            color: '#291C0E',
                            borderColor: '#A78D78',
                          }}
                        >
                          RECEIPT
                        </span>
                        <p className="text-[9px] font-mono font-bold mt-0.5" style={{ color: '#BEB5A9' }}>
                          #{createdOrder.invoiceNumber}
                        </p>
                      </div>
                    </div>

                    {/* Customer & Order Details */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl text-[10px]" style={{ backgroundColor: '#1F140A', border: '1px solid #6E473B' }}>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider block" style={{ color: '#A78D78' }}>Billed To:</span>
                        <strong className="font-bold block" style={{ color: '#E1D4C2' }}>{createdOrder.clientName}</strong>
                        <span className="text-[8.5px] font-mono" style={{ color: '#BEB5A9' }}>{createdOrder.mobileNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider block" style={{ color: '#A78D78' }}>Due Date:</span>
                        <strong className="font-bold block" style={{ color: '#E1D4C2' }}>{createdOrder.deliveryDue}</strong>
                        <span className="text-[8.5px] font-mono" style={{ color: '#BEB5A9' }}>Order: #{createdOrder.orderNumber}</span>
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="rounded-xl overflow-hidden border text-[10px]" style={{ borderColor: '#6E473B', backgroundColor: '#1A1007' }}>
                      <div className="px-2.5 py-1.5 font-bold uppercase text-[8.5px] grid grid-cols-12" style={{ backgroundColor: '#6E473B', color: '#E1D4C2' }}>
                        <div className="col-span-8">Service / Item</div>
                        <div className="col-span-4 text-right">Amount</div>
                      </div>
                      <div className="px-2.5 py-2 grid grid-cols-12 items-center">
                        <div className="col-span-8 font-bold" style={{ color: '#E1D4C2' }}>
                          <div>{createdOrder.serviceTitle}</div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {createdOrder.isUrgent && (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-rose-600 text-white">
                                ⚡ Express Urgent
                              </span>
                            )}
                            {createdOrder.passportSpecs?.attireType === 'suit' && (
                              <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-indigo-600 text-white">
                                👔 Digital Suit
                              </span>
                            )}
                            {createdOrder.passportSpecs?.attireType === 'original' && (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-slate-700 text-slate-300">
                                👕 Original Cloth
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-4 text-right font-black font-mono" style={{ color: '#E1D4C2' }}>
                          {formatCurrency(createdOrder.pricing.finalTotal)}
                        </div>
                      </div>
                    </div>

                    {/* QR Code & Settlement */}
                    <div className="grid grid-cols-12 gap-2 pt-1">
                      {/* Left: Google Pay QR */}
                      <div className="col-span-5 p-2 rounded-xl border flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#1F140A', borderColor: '#6E473B' }}>
                        <div className="p-1 rounded-lg bg-white shadow-xs">
                          <QRCodeSVG
                            value={`upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(profile.name)}&am=${createdOrder.payment.balanceDue > 0 ? createdOrder.payment.balanceDue : createdOrder.pricing.finalTotal}&cu=INR&tn=Invoice%20${encodeURIComponent(createdOrder.invoiceNumber)}`}
                            size={64}
                            level="M"
                          />
                        </div>
                        <span className="text-[7.5px] font-extrabold uppercase mt-1 tracking-wider" style={{ color: '#BEB5A9' }}>
                          Google Pay UPI
                        </span>
                        <span className="text-[7px] font-mono truncate max-w-full font-bold" style={{ color: '#A78D78' }}>
                          {profile.upiId}
                        </span>
                      </div>

                      {/* Right: Payment Breakdown */}
                      <div className="col-span-7 p-2.5 rounded-xl border flex flex-col justify-between space-y-1" style={{ backgroundColor: '#1A1208', borderColor: '#6E473B' }}>
                        <div className="space-y-0.5 text-[9.5px]">
                          <div className="flex justify-between" style={{ color: '#BEB5A9' }}>
                            <span>Total Bill:</span>
                            <strong className="font-bold font-mono text-[10px]" style={{ color: '#E1D4C2' }}>{formatCurrency(createdOrder.pricing.finalTotal)}</strong>
                          </div>
                          <div className="flex justify-between" style={{ color: '#BEB5A9' }}>
                            <span>Advance Paid:</span>
                            <strong className="font-bold font-mono text-[10px] text-emerald-400">{formatCurrency(createdOrder.payment.advancePaid)}</strong>
                          </div>
                        </div>

                        <div className="border-t pt-1" style={{ borderColor: '#6E473B' }}>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase" style={{ color: '#A78D78' }}>
                              {createdOrder.payment.balanceDue === 0 ? 'Status:' : 'Balance Due:'}
                            </span>
                            <strong className={`text-xs font-black font-mono ${createdOrder.payment.balanceDue === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {createdOrder.payment.balanceDue === 0 ? 'PAID IN FULL ✓' : formatCurrency(createdOrder.payment.balanceDue)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Official Seal & Visit Again */}
                    <div className="pt-2 border-t flex items-center justify-between text-[9px] font-medium" style={{ borderColor: '#6E473B', color: '#A78D78' }}>
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-[8px]">Verified Studio Receipt &bull; Mansa</span>
                      </div>
                      <div className="flex items-center gap-1 font-extrabold text-[10px] tracking-wide" style={{ color: '#E1D4C2' }}>
                        <span>Visit Again !</span>
                        <Smile className="w-3 h-3 text-amber-400 fill-amber-400/20 stroke-[2.2]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚡ 1-CLICK ACTION TOOLBAR: SHARE, COPY, DOWNLOAD, REVIEW, PRINT */}
              <div className="space-y-2 max-w-md mx-auto pt-1">
                {/* Primary WhatsApp Direct Share & Copy Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirectSendBillPhoto(createdOrder)}
                    disabled={isGeneratingCard}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(to right, #34A853, #25D366)',
                    }}
                    title="Send Bill Photo with UPI QR Code to Client WhatsApp"
                  >
                    {isGeneratingCard ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <Send className="w-4 h-4 stroke-[2.5] text-slate-950" />
                    )}
                    <span>⚡ Send Bill on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyBillPhoto}
                    disabled={isGeneratingCard}
                    className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs transition shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 border border-slate-700"
                    title="Copy HD Bill Photo to Clipboard"
                  >
                    {copySuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{copySuccess ? 'Copied to Clipboard!' : '📋 Copy Bill Photo'}</span>
                  </button>
                </div>

                {/* Secondary Action Row: HD Download, Google Review, Print */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadBillPhoto(createdOrder)}
                    disabled={isGeneratingCard}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
                    title="Download 3x Ultra-HD PNG"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectGoogleReview(createdOrder)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-[11px] transition border border-amber-500/30 active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Send Direct 5-Star Google Review Request"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>⭐ Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
                    title="Print Tax Invoice PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Print PDF</span>
                  </button>
                </div>

                {/* Full Modal Viewer Link */}
                <div className="pt-1 flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => setShowWhatsAppModal(true)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Open Full Screen Bill Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOrderCreated) onOrderCreated(createdOrder);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 text-xs font-bold transition"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Image Invoice Modal preview if requested from wizard */}
      {showWhatsAppModal && createdOrder && (
        <WhatsAppImageInvoiceModal
          order={createdOrder}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* Invoice Print Modal preview if requested from success screen */}
      {showPrintModal && createdOrder && (
        <InvoicePrintModal
          invoice={{
            id: createdOrder.id,
            invoiceNumber: createdOrder.invoiceNumber,
            clientId: createdOrder.customerId,
            clientName: createdOrder.clientName,
            clientPhone: createdOrder.mobileNumber,
            clientEmail: '',
            eventType: createdOrder.serviceCategory,
            eventDate: createdOrder.photoshootDate || createdOrder.createdAt,
            eventVenue: 'Sapna Photo Studio & Color Lab',
            issueDate: createdOrder.createdAt,
            dueDate: createdOrder.deliveryDue,
            items: [
              {
                id: 'item-1',
                name: createdOrder.serviceTitle,
                quantity: 1,
                rate: createdOrder.pricing.basePackagePrice,
                amount: createdOrder.pricing.basePackagePrice,
              },
            ],
            subtotal: createdOrder.pricing.subtotal,
            discount: createdOrder.pricing.discount,
            discountType: 'flat',
            taxRate: 0,
            taxAmount: 0,
            total: createdOrder.pricing.finalTotal,
            paidAmount: createdOrder.payment.advancePaid,
            balanceDue: createdOrder.payment.balanceDue,
            status: createdOrder.payment.balanceDue === 0 ? 'paid' : 'partially_paid',
            createdAt: createdOrder.createdAt,
          }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
