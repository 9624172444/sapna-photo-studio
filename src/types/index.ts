export type ServiceCategory =
  | 'passport_visa'
  | 'baby_photoshoot'
  | 'mobile_print_frame'
  | 'family_photoshoot'
  | 'birthday_photoshoot'
  | 'wedding_photography'
  | 'event_photography'
  | 'photo_printing'
  | 'photo_frame'
  | 'lamination'
  | 'photo_restoration'
  | 'photo_enlargement'
  | 'video_shoot'
  | 'custom_service';

export type OrderStatus =
  | 'new_order'
  | 'photoshoot_completed'
  | 'photo_selection_pending'
  | 'photos_selected'
  | 'editing_pending'
  | 'editing_in_progress'
  | 'editing_completed'
  | 'client_approval_pending'
  | 'printing_pending'
  | 'production_in_progress'
  | 'ready_for_delivery'
  | 'delivered'
  | 'completed';

export type PaymentStatus = 'unpaid' | 'advance_paid' | 'partially_paid' | 'fully_paid';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'split' | 'other';

export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'cred' | 'other_upi';

export type EmployeeRole = 'admin' | 'counter' | 'photographer' | 'editor';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  mobile: string;
  active: boolean;
}

export interface PassportSpecs {
  countryOrType: string;
  photoSize: string;
  backgroundColor: 'White' | 'Blue' | 'Grey' | 'Light Grey' | 'Custom';
  attireType?: 'original' | 'suit';
  quantity: number;
  deliveryTime: string;
  price: number;
  photoNumber?: string;
}

export interface BabyShootSpecs {
  babyName: string;
  parentName: string;
  babyAge: string;
  occasion: string;
  photoshootDate: string;
  packageType: 'basic' | 'standard' | 'premium' | 'custom';
  packageName: string;
  themesCount?: number;
}

export interface MobilePrintSpecs {
  source: 'mobile' | 'whatsapp' | 'usb';
  printSize: string;
  frameSize?: string;
  frameType?: string;
  quantity: number;
  editingRequired: boolean;
  laminationRequired?: boolean;
}

export interface PhotoCountRecord {
  cameraPhotosTaken: number;
  clientSelected: number;
  rejected: number;
  extraSelected: number;
  extraPhotoRate: number;
  photosEdited: number;
  finalDelivered: number;
}

export interface OrderPricing {
  basePackagePrice: number;
  includedPhotos: number;
  extraPhotoRate: number;
  extraPhotoTotal: number;
  printCharges: number;
  frameCharges: number;
  laminationCharges: number;
  customCharges: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  finalTotal: number;
}

export interface SplitPaymentBreakdown {
  cashAmount: number;
  onlineAmount: number;
  upiApp?: UpiApp;
  onlineMode?: 'upi' | 'card' | 'bank_transfer';
}

export interface OrderPaymentInfo {
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  status: PaymentStatus;
  mode: PaymentMode;
  upiApp?: UpiApp;
  splitDetails?: SplitPaymentBreakdown;
  transactionRef?: string;
}

export interface StudioOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  clientName: string;
  mobileNumber: string;
  whatsappNumber?: string;
  address?: string;
  customerType: 'new' | 'existing';
  serviceCategory: ServiceCategory;
  serviceTitle: string;
  passportSpecs?: PassportSpecs;
  babySpecs?: BabyShootSpecs;
  mobilePrintSpecs?: MobilePrintSpecs;
  photoshootId?: string;
  photoSource?: 'camera' | 'whatsapp' | 'scan' | 'usb';
  photoNumber?: string; // Camera DSC / WhatsApp File / Scan ID / Roll No (e.g. DSC_4092, WA_IMG_01, SCAN_01)
  photographerName?: string;
  cameraUsed?: string;
  photoshootDate?: string;
  startTime?: string;
  endTime?: string;
  photoCount: PhotoCountRecord;
  status: OrderStatus;
  pricing: OrderPricing;
  payment: OrderPaymentInfo;
  invoiceNumber: string;
  createdAt: string;
  deliveryDue: string;
  createdBy: string;
  updatedBy: string;
  isUrgent?: boolean;
  notes?: string;
}

export interface DeletedOrder extends StudioOrder {
  deletedAt: string;
  deletedBy?: string;
  deleteReason?: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  mobile: string;
  whatsapp: string;
  address?: string;
  totalVisits: number;
  totalOrders: number;
  totalSpent: number;
  pendingBalance: number;
  firstVisitDate: string;
  lastVisitDate: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  eventType: string;
  eventDate: string;
  eventVenue: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'flat';
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: 'paid' | 'partially_paid' | 'pending';
  notes?: string;
  terms?: string;
  createdAt: string;
}

export interface StudioProfile {
  name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  gstNumber?: string;
  upiId: string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
  currency: string;
  logoUrl?: string;
  googleReviewUrl?: string;
  defaultTerms: string[];
}

export interface ServicePackage {
  id: string;
  serviceCategory: ServiceCategory;
  serviceTitle: string;
  name: string; // e.g. "12 Copies Package", "24 Copies Package", "35x45mm (10 Copies)"
  copies: number;
  size: string; // e.g. "35x45 mm", "50x70 mm", "2x2 inch", "6x8 inch"
  price: number;
  urgentPriceDelta?: number;
  description?: string;
  active: boolean;
}

export interface FramePriceConfig {
  id: string;
  size: string; // "6x8", "8x10", "8x12", "10x12", "12x15", "12x18", "16x20", "20x30", "24x34"
  velFramePrice: number;
  royalFramePrice: number;
  allowHighQualityLamination?: boolean;
  active: boolean;
}

export interface LaminationOptionConfig {
  id: string;
  name: string; // "Normal Lamination", "High Quality Lamination"
  surcharge: number; // ₹0 for normal, ₹1000 for High Quality
  active: boolean;
}

export interface PrintOnlyPriceConfig {
  id: string;
  size: string; // "Mobile Direct", "6x8", "8x12", "10x12", "12x15", "12x18", "16x20", "20x24", "20x30"
  editingType: 'no_editing' | 'editing';
  price: number;
  active: boolean;
}

export interface ServiceItemConfig {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  basePrice: number;
  includedPhotos: number;
  extraPhotoRate: number;
  estimatedMinutes: number;
  active?: boolean;
}
