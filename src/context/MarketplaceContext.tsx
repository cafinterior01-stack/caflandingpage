'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { PRODUCTS_CATALOG } from '@/lib/catalog-data';
import { calculatePaySmallSmall } from '@/lib/format';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone: string;
  address?: string;
  city?: string;
  state?: string;
}

interface CustomisationTarget {
  product?: Product;
  defaultCategory?: string;
}

interface MarketplaceContextType {
  user: AuthenticatedUser | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (
    product: Product,
    options?: {
      quantity?: number;
      selectedSize?: string;
      selectedColor?: string;
      unitPrice?: number;
      paymentPlan?: 'FULL_PAYMENT' | 'PAY_SMALL_SMALL';
      instalmentMonths?: number;
    }
  ) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  updateCartItemPlan: (
    index: number,
    paymentPlan: 'FULL_PAYMENT' | 'PAY_SMALL_SMALL',
    instalmentMonths?: number
  ) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotalFullValue: number;
  cartPayableToday: number;
  cartRemainingBalance: number;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  compareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
  comparedProducts: Product[];
  customModalTarget: CustomisationTarget | null;
  openCustomModal: (target?: CustomisationTarget) => void;
  closeCustomModal: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [customModalTarget, setCustomModalTarget] = useState<CustomisationTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      showToast('You have signed out of your CAF Interiors account.');
    } catch {
      // ignore
    }
  }, [showToast]);

  useEffect(() => {
    refreshUser();
    try {
      const savedCart = localStorage.getItem('caf_luxury_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedCompare = localStorage.getItem('caf_luxury_compare');
      if (savedCompare) {
        setCompareIds(JSON.parse(savedCompare));
      }
    } catch {
      // ignore storage errors
    }
  }, [refreshUser]);

  useEffect(() => {
    try {
      localStorage.setItem('caf_luxury_cart', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('caf_luxury_compare', JSON.stringify(compareIds));
    } catch {
      // ignore storage errors
    }
  }, [compareIds]);

  const addToCart: MarketplaceContextType['addToCart'] = (product, options) => {
    const quantity = options?.quantity || 1;
    const selectedSize = options?.selectedSize || product.sizes[0]?.label || 'Standard';
    const selectedColor = options?.selectedColor || product.colors[0]?.name || 'Signature Finish';
    const unitPrice = options?.unitPrice || product.price;
    const paymentPlan = options?.paymentPlan || 'FULL_PAYMENT';
    const instalmentMonths =
      paymentPlan === 'PAY_SMALL_SMALL'
        ? options?.instalmentMonths || product.paySmallSmall.allowedDurationsMonths[0] || 3
        : undefined;

    let initialDepositPerUnit = unitPrice;
    if (paymentPlan === 'PAY_SMALL_SMALL' && product.paySmallSmall.eligible) {
      const calc = calculatePaySmallSmall(
        unitPrice,
        instalmentMonths || 3,
        product.paySmallSmall.depositPercentage,
        unitPrice === product.price ? product.paySmallSmall.fixedDepositAmount : undefined
      );
      initialDepositPerUnit = calc.initialDeposit;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor &&
          item.paymentPlan === paymentPlan &&
          item.instalmentMonths === instalmentMonths
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          unitPrice,
          quantity,
          selectedSize,
          selectedColor,
          paymentPlan,
          instalmentMonths,
          initialDepositPerUnit,
        },
      ];
    });

    showToast(
      paymentPlan === 'PAY_SMALL_SMALL'
        ? `Added "${product.name}" (Pay Small Small Plan) to your bag.`
        : `Added "${product.name}" to your shopping bag.`
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index].quantity = quantity;
      }
      return updated;
    });
  };

  const updateCartItemPlan = (
    index: number,
    paymentPlan: 'FULL_PAYMENT' | 'PAY_SMALL_SMALL',
    instalmentMonths?: number
  ) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      if (!item) return prev;

      const product = PRODUCTS_CATALOG.find((p) => p.id === item.productId);
      if (!product) return prev;

      if (paymentPlan === 'PAY_SMALL_SMALL' && product.paySmallSmall.eligible) {
        const months =
          instalmentMonths ||
          item.instalmentMonths ||
          product.paySmallSmall.allowedDurationsMonths[0] ||
          3;
        const calc = calculatePaySmallSmall(
          item.unitPrice,
          months,
          product.paySmallSmall.depositPercentage,
          item.unitPrice === product.price ? product.paySmallSmall.fixedDepositAmount : undefined
        );
        updated[index] = {
          ...item,
          paymentPlan: 'PAY_SMALL_SMALL',
          instalmentMonths: months,
          initialDepositPerUnit: calc.initialDeposit,
        };
      } else {
        updated[index] = {
          ...item,
          paymentPlan: 'FULL_PAYMENT',
          instalmentMonths: undefined,
          initialDepositPerUnit: item.unitPrice,
        };
      }
      return updated;
    });
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalFullValue = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartPayableToday = cart.reduce(
    (sum, item) =>
      sum +
      (item.paymentPlan === 'PAY_SMALL_SMALL' && item.initialDepositPerUnit
        ? item.initialDepositPerUnit
        : item.unitPrice) *
        item.quantity,
    0
  );
  const cartRemainingBalance = Math.max(0, cartTotalFullValue - cartPayableToday);

  const toggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed product from comparison list.');
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 4) {
        showToast('You can compare up to 4 products at a time.');
        return prev;
      }
      showToast('Added product to side-by-side comparison.');
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareIds([]);

  const comparedProducts = PRODUCTS_CATALOG.filter((p) => compareIds.includes(p.id));

  const openCustomModal = (target?: CustomisationTarget) => {
    setCustomModalTarget(target || {});
  };

  const closeCustomModal = () => setCustomModalTarget(null);

  return (
    <MarketplaceContext.Provider
      value={{
        user,
        authLoading,
        refreshUser,
        logout,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItemPlan,
        clearCart,
        cartCount,
        cartTotalFullValue,
        cartPayableToday,
        cartRemainingBalance,
        compareIds,
        toggleCompare,
        clearCompare,
        compareOpen,
        setCompareOpen,
        comparedProducts,
        customModalTarget,
        openCustomModal,
        closeCustomModal,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return ctx;
}
