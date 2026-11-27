export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  featured?: boolean;
}

export interface ProductSizeOption {
  label: string;
  dimensions: string;
  priceAdjustment: number;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  sizes: ProductSizeOption[];
  colors: ProductColorOption[];
  materials: {
    frame: string;
    upholstery: string;
    foamOrFinish: string;
    origin: string;
  };
  availability: 'IN_STOCK' | 'MADE_TO_ORDER' | 'LIMITED_EDITION';
  availabilityLabel: string;
  estimatedDelivery: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isExclusiveOffer: boolean;
  isPublished?: boolean;
  paySmallSmall: {
    eligible: boolean;
    depositPercentage: number; // e.g., 33.3333 for 500k on 1.5M, or 30, 40
    fixedDepositAmount?: number;
    allowedDurationsMonths: number[]; // e.g., [2, 3, 4, 6]
    conditions: string;
  };
  rating: number;
  reviewCount: number;
  warranty: string;
  sku: string;
}

export interface InstalmentScheduleItem {
  instalmentNumber: number;
  dueDateLabel: string;
  amount: number;
  status: 'INITIAL_DEPOSIT' | 'SCHEDULED';
}

export interface InstalmentCalculation {
  fullPrice: number;
  depositPercentage: number;
  initialDeposit: number;
  remainingBalance: number;
  durationMonths: number;
  monthlyInstalment: number;
  schedule: InstalmentScheduleItem[];
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  paymentPlan: 'FULL_PAYMENT' | 'PAY_SMALL_SMALL';
  instalmentMonths?: number;
  initialDepositPerUnit?: number;
}

export interface InteriorService {
  id: string;
  title: string;
  slug: string;
  category: 'Residential' | 'Commercial & Institutional' | 'Specialist Finishes';
  shortDescription: string;
  features: string[];
  image: string;
  startingEstimate: string;
}

export interface CompletedProject {
  id: string;
  title: string;
  location: string;
  category: string;
  completionYear: string;
  image: string;
  scope: string;
  summary: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  clientRole: string;
  location: string;
  quote: string;
  rating: number;
  projectOrProduct: string;
}

