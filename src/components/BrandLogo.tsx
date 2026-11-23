'use client';

import React from 'react';
import Link from 'next/link';

export type BrandLogoVariant =
  | 'header'
  | 'mobile-drawer'
  | 'footer'
  | 'dashboard'
  | 'auth'
  | 'checkout'
  | 'receipt'
  | 'loading';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  href?: string | null;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

/**
 * Central Reusable Official CAF Interiors Logo Component.
 * Uses the exact, unmodified original logo image (/caf-interiors-logo.jpg)
 * with alt="CAF Interiors Official Logo" and preserved aspect ratio.
 */
export default function BrandLogo({
  variant = 'header',
  href = '/',
  onClick,
  className = '',
  priority = false,
}: BrandLogoProps) {
  const imgElement = (
    <span className={`caf-official-logo-frame variant-${variant} ${className}`.trim()}>
      <img
        src="/caf-interiors-logo.jpg"
        alt="CAF Interiors Official Logo"
        className="caf-official-logo-img"
        loading={priority || variant === 'header' || variant === 'loading' ? 'eager' : 'lazy'}
        decoding="async"
      />
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`caf-official-logo-link link-${variant}`}
        onClick={onClick}
        aria-label="CAF Interiors Official Logo — Home"
      >
        {imgElement}
      </Link>
    );
  }

  return imgElement;
}

