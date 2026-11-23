import React from 'react';
import BrandLogo from '@/components/BrandLogo';

export default function GlobalLoadingScreen() {
  return (
    <div className="caf-global-loading-screen" role="status" aria-live="polite">
      <div className="caf-loading-card">
        <BrandLogo variant="loading" href={null} priority />
        <div className="caf-loading-progress-bar">
          <div className="caf-loading-progress-fill" />
        </div>
        <p className="caf-loading-caption">
          CAF Interior and Exterior Service • Loading Luxury Experience...
        </p>
      </div>
    </div>
  );
}
