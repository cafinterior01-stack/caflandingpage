import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CartItem,
  InstalmentScheduleItem,
  Product,
  Category,
  Testimonial,
} from '@/types';
import {
  PRODUCTS_CATALOG,
  FURNITURE_CATEGORIES,
  CUSTOMER_TESTIMONIALS,
} from '@/lib/catalog-data';
import { calculatePaySmallSmall } from '@/lib/format';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt: string;
}

export interface InstalmentPaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  instalmentNumber: number;
  label: string;
  amount: number;
  paymentMethod: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';
  paymentReference: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  receiptNumber?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface OrderNotificationRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  type: 'PAYMENT_REMINDER' | 'ORDER_UPDATE' | 'APPROVAL_STATUS';
  title: string;
  message: string;
  dueDate?: string;
  channel: 'DASHBOARD' | 'WHATSAPP' | 'EMAIL';
  createdAt: string;
  isRead: boolean;
}

export interface PaySmallSmallConfig {
  enabled: boolean;
  minQualifyingPrice: number;
  defaultDepositPercentage: number;
  allowedDurationsMonths: number[];
  requireAdminApproval: boolean;
  requireVerifiedPaymentConfirmation: boolean;
  reminderDaysBeforeDue: number;
  conditions: string[];
  productOverrides: Record<
    string,
    {
      eligible: boolean;
      depositPercentage: number;
      fixedDepositAmount?: number;
      allowedDurationsMonths: number[];
    }
  >;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  deliveryNotes?: string;
  items: CartItem[];
  hasPaySmallSmall: boolean;
  subtotalFullValue: number;
  deliveryFee: number;
  discountAmount: number;
  promoCode?: string;
  totalOrderValue: number;
  payableTodayAmount: number;
  remainingBalance: number;
  amountPaidVerified: number;
  paymentMethod: 'PAYSTACK' | 'FLUTTERWAVE' | 'BANK_TRANSFER';
  paymentReference: string;
  paymentStatus: 'AWAITING_VERIFICATION' | 'PARTIALLY_PAID_VERIFIED' | 'PAID_VERIFIED';
  instalmentApprovalStatus: 'NOT_APPLICABLE' | 'PENDING_ADMIN_REVIEW' | 'APPROVED' | 'REJECTED';
  orderStatus: 'PENDING_VERIFICATION' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  instalmentSchedule: InstalmentScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItemRecord {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuotationRecord {
  id: string;
  quotationNumber: string;
  enquiryId: string;
  enquiryNumber: string;
  customerName: string;
  customerEmail: string;
  items: QuotationItemRecord[];
  subtotal: number;
  deliveryAndInstallationFee: number;
  totalQuotedAmount: number;
  paySmallSmallEligible: boolean;
  requiredDepositAmount: number;
  estimatedLeadTime: string;
  adminNotes: string;
  validUntil: string;
  customerDecision: 'PENDING_CUSTOMER_ACCEPTANCE' | 'ACCEPTED' | 'REVISION_REQUESTED' | 'DECLINED';
  customerFeedback?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface CustomFurnitureEnquiryRecord {
  id: string;
  enquiryNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  category: string;
  referencePictures: string[];
  sketchImages: string[];
  measurements: string;
  preferredMaterials: string;
  colorsAndFinishing: string;
  requirementsDescription: string;
  location: string;
  paySmallSmallRequested: boolean;
  status:
  | 'SUBMITTED_FOR_REVIEW'
  | 'QUOTATION_SENT'
  | 'CUSTOMER_ACCEPTED'
  | 'REVISION_REQUESTED'
  | 'IN_FABRICATION'
  | 'COMPLETED';
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InteriorProjectMilestone {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  completionPercent: number;
  deliverableNote: string;
  updatedAt: string;
}

export interface InteriorDesignProjectRecord {
  id: string;
  projectNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  propertyType: string;
  propertyLocation: string;
  estimatedBudget: string;
  preferredConsultationDate: string;
  projectDescription: string;
  propertyPhotographs: string[];
  status:
  | 'CONSULTATION_BOOKED'
  | 'SITE_INSPECTION_SCHEDULED'
  | 'PROPOSAL_APPROVED'
  | 'ACTIVE_EXECUTION'
  | 'COMPLETED';
  assignedArchitect: string;
  overallProgressPercent: number;
  approvedContractAmount: number;
  amountPaidVerified: number;
  milestones: InteriorProjectMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface PromoRecord {
  code: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount: number;
  active: boolean;
}

interface DatabaseSchema {
  users: UserRecord[];
  orders: OrderRecord[];
  promotions: PromoRecord[];
  instalmentPayments: InstalmentPaymentRecord[];
  notifications: OrderNotificationRecord[];
  paySmallSmallConfig: PaySmallSmallConfig;
  customEnquiries: CustomFurnitureEnquiryRecord[];
  quotations: QuotationRecord[];
  interiorProjects: InteriorDesignProjectRecord[];
  products?: Product[];
  categories?: Category[];
  testimonials?: Testimonial[];
  promotionalBanner?: string;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'prisma', 'caf-marketplace-store.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`caf_salt_${password}`).digest('hex');
}

export function createSessionToken(user: UserRecord): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  return Buffer.from(payload, 'utf-8').toString('base64url');
}

export function parseSessionToken(token?: string): { id: string; email: string; role: string; name: string } | null {
  if (!token) return null;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const DEFAULT_DB: DatabaseSchema = {
  users: [
    {
      id: 'usr-admin-1',
      name: 'CAF Interiors Administrator',
      email: 'admin@cafinteriors.ng',
      passwordHash: hashPassword('CAFAdmin2026!'),
      role: 'ADMIN',
      phone: '+234 903 026 2160',
      address: 'CAF Interiors Flagship Atelier',
      city: 'Lekki Phase 1',
      state: 'Lagos',
      createdAt: '2026-01-10T09:00:00.000Z',
    },
    {
      id: 'usr-cust-1',
      name: 'Chief Adebayo Ogunlesi',
      email: 'client@cafinteriors.ng',
      passwordHash: hashPassword('Luxury2026!'),
      role: 'CUSTOMER',
      phone: '+234 803 555 0192',
      address: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      createdAt: '2026-02-15T12:30:00.000Z',
    },
  ],
  orders: [
    {
      id: 'ord-demo-1',
      orderNumber: 'CAF-2026-1042',
      userId: 'usr-cust-1',
      customerName: 'Chief Adebayo Ogunlesi',
      customerEmail: 'client@cafinteriors.ng',
      customerPhone: '+234 803 555 0192',
      deliveryAddress: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lekki',
      state: 'Lagos',
      deliveryNotes: 'Deliver with white-glove master bedroom assembly team.',
      items: [
        {
          productId: 'prod-1',
          slug: 'luxury-6x6-upholstered-bed-royal-sovereign',
          name: 'Luxury 6x6 Upholstered Bed — Royal Sovereign Edition',
          image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85',
          unitPrice: 1500000,
          quantity: 1,
          selectedSize: '6x6 ft (King Standard)',
          selectedColor: 'Champagne Ivory',
          paymentPlan: 'PAY_SMALL_SMALL',
          instalmentMonths: 4,
          initialDepositPerUnit: 500000,
        },
      ],
      hasPaySmallSmall: true,
      subtotalFullValue: 1500000,
      deliveryFee: 0,
      discountAmount: 0,
      totalOrderValue: 1500000,
      payableTodayAmount: 500000,
      remainingBalance: 1000000,
      amountPaidVerified: 500000,
      paymentMethod: 'PAYSTACK',
      paymentReference: 'CAF-PSTK-9948210',
      paymentStatus: 'PARTIALLY_PAID_VERIFIED',
      instalmentApprovalStatus: 'APPROVED',
      orderStatus: 'IN_PRODUCTION',
      instalmentSchedule: calculatePaySmallSmall(1500000, 4, 33.3333, 500000).schedule,
      createdAt: '2026-11-01T10:15:00.000Z',
      updatedAt: '2026-11-02T14:20:00.000Z',
    },
  ],
  instalmentPayments: [
    {
      id: 'pay-demo-1',
      orderId: 'ord-demo-1',
      orderNumber: 'CAF-2026-1042',
      instalmentNumber: 0,
      label: 'Initial Deposit (33.3% — Commence Order)',
      amount: 500000,
      paymentMethod: 'PAYSTACK',
      paymentReference: 'CAF-PSTK-9948210',
      status: 'VERIFIED',
      receiptNumber: 'RCP-CAF-2026-001',
      submittedAt: '2026-11-01T10:16:00.000Z',
      verifiedAt: '2026-11-01T10:18:00.000Z',
      verifiedBy: 'Paystack Webhook & CAF Finance Desk',
      notes: 'Verified initial deposit of ₦500,000 for Luxury 6x6 Upholstered Bed.',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      orderId: 'ord-demo-1',
      orderNumber: 'CAF-2026-1042',
      type: 'APPROVAL_STATUS',
      title: 'Pay Small Small Plan Approved',
      message:
        'Your 4-month Pay Small Small arrangement for the Luxury 6x6 Upholstered Bed (Full Price: ₦1,500,000 | Deposit Paid: ₦500,000 | Remaining Balance: ₦1,000,000) has been approved by CAF Interiors.',
      channel: 'DASHBOARD',
      createdAt: '2026-11-01T12:00:00.000Z',
      isRead: false,
    },
    {
      id: 'notif-2',
      orderId: 'ord-demo-1',
      orderNumber: 'CAF-2026-1042',
      type: 'ORDER_UPDATE',
      title: 'Workshop Milestone: Kiln-Dried Mahogany Frame Completed',
      message:
        'Our master woodworkers have completed the seasoned mahogany structural frame for your 6x6 Royal Sovereign Bed. Italian velvet upholstery and brass inlay crafting has commenced.',
      channel: 'WHATSAPP',
      createdAt: '2026-11-05T15:30:00.000Z',
      isRead: false,
    },
    {
      id: 'notif-3',
      orderId: 'ord-demo-1',
      orderNumber: 'CAF-2026-1042',
      type: 'PAYMENT_REMINDER',
      title: 'Upcoming Instalment Reminder: Month 1 (₦250,000)',
      message:
        'Friendly reminder: Your Month 1 instalment of ₦250,000 for Order CAF-2026-1042 is scheduled in 7 days. You can pay securely via Paystack, Flutterwave, or Corporate Bank Transfer.',
      dueDate: '2026-12-01',
      channel: 'EMAIL',
      createdAt: '2026-11-10T09:00:00.000Z',
      isRead: false,
    },
  ],
  paySmallSmallConfig: {
    enabled: true,
    minQualifyingPrice: 450000,
    defaultDepositPercentage: 33.3333,
    allowedDurationsMonths: [2, 3, 4, 6],
    requireAdminApproval: true,
    requireVerifiedPaymentConfirmation: true,
    reminderDaysBeforeDue: 5,
    conditions: [
      'Not every product qualifies: Pay Small Small applies only to eligible furniture items marked with the Pay Small Small badge (typically orders above ₦450,000).',
      'No automatic credit approval: Every instalment application is reviewed and approved by CAF Interiors administration.',
      'Initial deposit required: An approved initial deposit (30% to 40%, or ₦500,000 on the ₦1,500,000 Luxury 6x6 Upholstered Bed) is required to initiate workshop fabrication or reservation.',
      'Strict payment verification: No payment is marked completed or deducted from your remaining balance without verified Paystack/Flutterwave webhook confirmation or administrator bank transfer verification.',
      'Delivery & ownership: Scheduled delivery and final handover align with your approved CAF Interiors instalment agreement.',
    ],
    productOverrides: {
      'prod-1': {
        eligible: true,
        depositPercentage: 33.3333,
        fixedDepositAmount: 500000,
        allowedDurationsMonths: [2, 3, 4, 6],
      },
      'prod-12': {
        eligible: false,
        depositPercentage: 100,
        allowedDurationsMonths: [1],
      },
    },
  },
  customEnquiries: [
    {
      id: 'enq-demo-1',
      enquiryNumber: 'CAF-CUS-2026-401',
      userId: 'usr-cust-1',
      customerName: 'Chief Adebayo Ogunlesi',
      customerEmail: 'client@cafinteriors.ng',
      customerPhone: '+234 803 555 0192',
      category: 'Dining Furniture',
      referencePictures: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80',
      ],
      sketchImages: [
        'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=900&q=80',
      ],
      measurements: '320cm Length × 125cm Width × 76cm Height (10-Seater Formal Dining Room)',
      preferredMaterials: 'Book-Matched Nigerian Mahogany Core, Nero Marquina Marble Inlay & PVD Brass Base',
      colorsAndFinishing: 'Obsidian Nero Marble with Brushed Champagne Gold Pedestals & Ivory Bouclé Chairs',
      requirementsDescription:
        'Custom 10-seater formal dining table with concealed lazy-Susan turntable and 10 high-back quilted dining chairs with brass Sabot leg tips.',
      location: '14 Admiralty Way, Lekki Phase 1, Lagos',
      paySmallSmallRequested: true,
      status: 'QUOTATION_SENT',
      quotationId: 'qtn-demo-1',
      createdAt: '2026-11-04T11:20:00.000Z',
      updatedAt: '2026-11-05T16:45:00.000Z',
    },
  ],
  quotations: [
    {
      id: 'qtn-demo-1',
      quotationNumber: 'QTN-CAF-2026-881',
      enquiryId: 'enq-demo-1',
      enquiryNumber: 'CAF-CUS-2026-401',
      customerName: 'Chief Adebayo Ogunlesi',
      customerEmail: 'client@cafinteriors.ng',
      items: [
        {
          description: 'Bespoke 320cm Nero Marquina & Brushed Champagne Brass Double-Pedestal Banquet Table',
          quantity: 1,
          unitPrice: 1950000,
          total: 1950000,
        },
        {
          description: 'Hand-Tufted Ivory Bouclé High-Back Dining Chairs with Brass Sabot Tips',
          quantity: 10,
          unitPrice: 135000,
          total: 1350000,
        },
      ],
      subtotal: 3300000,
      deliveryAndInstallationFee: 100000,
      totalQuotedAmount: 3400000,
      paySmallSmallEligible: true,
      requiredDepositAmount: 1200000,
      estimatedLeadTime: '18 – 21 Business Days (Includes 3D CAD Shop Drawing & Site Delivery)',
      adminNotes:
        'Quotation includes protective heat-and-stain marble sealing and 5-year structural warranty. Eligible for a 4-month Pay Small Small schedule after ₦1,200,000 initial deposit.',
      validUntil: '2026-12-15',
      customerDecision: 'PENDING_CUSTOMER_ACCEPTANCE',
      createdAt: '2026-11-05T16:45:00.000Z',
    },
  ],
  interiorProjects: [
    {
      id: 'prj-demo-1',
      projectNumber: 'CAF-PRJ-2026-701',
      userId: 'usr-cust-1',
      customerName: 'Chief Adebayo Ogunlesi',
      customerEmail: 'client@cafinteriors.ng',
      customerPhone: '+234 803 555 0192',
      serviceType: 'Living Room Transformation',
      propertyType: '5-Bedroom Detached Duplex Penthouse',
      propertyLocation: '14 Admiralty Way, Lekki Phase 1, Lagos',
      estimatedBudget: '₦12,000,000 – ₦15,000,000',
      preferredConsultationDate: '2026-10-20',
      projectDescription:
        'Complete double-volume living salon transformation including fluted walnut & sintered marble media wall, coffered POP ceiling with warm magnetic track lighting, motorized blackout drapery, and custom 9-seater U-shape bouclé sectional.',
      propertyPhotographs: [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      ],
      status: 'ACTIVE_EXECUTION',
      assignedArchitect: 'Arc. Tunde Bakare (Senior Lead Interior Architect, CAF Interiors)',
      overallProgressPercent: 68,
      approvedContractAmount: 13500000,
      amountPaidVerified: 9000000,
      milestones: [
        {
          id: 'ms-1',
          stepNumber: 1,
          title: 'Site Inspection, Laser Measurement & Acoustic Audit',
          description: 'Full spatial survey, electrical load mapping, and double-volume wall measurement.',
          status: 'COMPLETED',
          completionPercent: 100,
          deliverableNote: 'Completed & signed off on Oct 22, 2026.',
          updatedAt: '2026-10-22T14:00:00.000Z',
        },
        {
          id: 'ms-2',
          stepNumber: 2,
          title: '3D Photorealistic CAD Renders & Material Moodboard Sign-Off',
          description: 'Client approval of walnut veneer, Calacatta stone slab, brass trims, and bouclé swatches.',
          status: 'COMPLETED',
          completionPercent: 100,
          deliverableNote: '4K renders and physical material sample box approved.',
          updatedAt: '2026-10-28T17:30:00.000Z',
        },
        {
          id: 'ms-3',
          stepNumber: 3,
          title: 'POP Ceiling Architecture, Cove LED & Fluted Wall Panelling',
          description: 'On-site installation of recessed magnetic track lights, 3000K warm coves, and 6m fluted wall.',
          status: 'COMPLETED',
          completionPercent: 100,
          deliverableNote: 'Ceiling & book-matched marble media wall completed.',
          updatedAt: '2026-11-08T16:15:00.000Z',
        },
        {
          id: 'ms-4',
          stepNumber: 4,
          title: 'Bespoke Furniture & Drapery Workshop Fabrication',
          description: 'Crafting the 9-seater modular sectional, brass centre table, and motorized sheer/blackout curtains.',
          status: 'IN_PROGRESS',
          completionPercent: 75,
          deliverableNote: 'Upholstery 75% complete at CAF Interiors Lagos Workshop; final QC in 4 days.',
          updatedAt: '2026-11-18T11:00:00.000Z',
        },
        {
          id: 'ms-5',
          stepNumber: 5,
          title: 'White-Glove Furniture Delivery, Chandelier Rigging & Styling',
          description: 'On-site placement, crystal chandelier installation, rug positioning, and scent/art styling.',
          status: 'UPCOMING',
          completionPercent: 0,
          deliverableNote: 'Scheduled for Nov 28, 2026.',
          updatedAt: '2026-11-18T11:00:00.000Z',
        },
        {
          id: 'ms-6',
          stepNumber: 6,
          title: 'Final Walkthrough, Warranty Issuance & Client Handover',
          description: 'Joint inspection with Chief Ogunlesi and issuance of 5-year CAF Interiors warranty certificate.',
          status: 'UPCOMING',
          completionPercent: 0,
          deliverableNote: 'Scheduled for Dec 02, 2026.',
          updatedAt: '2026-11-18T11:00:00.000Z',
        },
      ],
      createdAt: '2026-10-19T09:30:00.000Z',
      updatedAt: '2026-11-18T11:00:00.000Z',
    },
  ],
  promotions: [
    {
      code: 'CAFLUXURY5',
      description: '5% Privilege Discount on Luxury Furniture Orders',
      type: 'PERCENTAGE',
      value: 5,
      minOrderAmount: 500000,
      active: true,
    },
    {
      code: 'WELCOME50K',
      description: '₦50,000 Off Orders Above ₦1,000,000',
      type: 'FIXED',
      value: 50000,
      minOrderAmount: 1000000,
      active: true,
    },
  ],
};

let memoryCache: DatabaseSchema | null = null;

export function readDb(): DatabaseSchema {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      const existingProdIds = new Set((parsed.products || []).map((p) => p.id));
      const mergedProducts = [
        ...(parsed.products || []),
        ...PRODUCTS_CATALOG.filter((p) => !existingProdIds.has(p.id)),
      ];
      const existingCatIds = new Set((parsed.categories || []).map((c) => c.id));
      const mergedCategories = [
        ...(parsed.categories || []),
        ...FURNITURE_CATEGORIES.filter((c) => !existingCatIds.has(c.id)),
      ];
      memoryCache = {
        users: parsed.users || DEFAULT_DB.users,
        orders: parsed.orders || DEFAULT_DB.orders,
        promotions: parsed.promotions || DEFAULT_DB.promotions,
        instalmentPayments: parsed.instalmentPayments || DEFAULT_DB.instalmentPayments,
        notifications: parsed.notifications || DEFAULT_DB.notifications,
        paySmallSmallConfig: parsed.paySmallSmallConfig || DEFAULT_DB.paySmallSmallConfig,
        customEnquiries: parsed.customEnquiries || DEFAULT_DB.customEnquiries,
        quotations: parsed.quotations || DEFAULT_DB.quotations,
        interiorProjects: parsed.interiorProjects || DEFAULT_DB.interiorProjects,
        products: mergedProducts.length > 0 ? mergedProducts : JSON.parse(JSON.stringify(PRODUCTS_CATALOG)),
        categories: mergedCategories.length > 0 ? mergedCategories : JSON.parse(JSON.stringify(FURNITURE_CATEGORIES)),
        testimonials: parsed.testimonials || JSON.parse(JSON.stringify(CUSTOMER_TESTIMONIALS)),
        promotionalBanner:
          parsed.promotionalBanner ||
          'Pay Small Small Available: Flexible 2–6 Month Instalments on Eligible Luxury Furniture',
      };
      return memoryCache;
    }
  } catch {
    // Fallback to default in serverless/read-only environments
  }
  memoryCache = {
    ...JSON.parse(JSON.stringify(DEFAULT_DB)),
    products: JSON.parse(JSON.stringify(PRODUCTS_CATALOG)),
    categories: JSON.parse(JSON.stringify(FURNITURE_CATEGORIES)),
    testimonials: JSON.parse(JSON.stringify(CUSTOMER_TESTIMONIALS)),
    promotionalBanner:
      'Pay Small Small Available: Flexible 2–6 Month Instalments on Eligible Luxury Furniture',
  } as DatabaseSchema;
  saveDb(memoryCache);
  return memoryCache;
}

export function saveDb(data: DatabaseSchema): void {
  memoryCache = data;
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // In read-only cloud environments, memoryCache preserves session state
  }
}
