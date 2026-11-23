import { InstalmentCalculation, InstalmentScheduleItem } from '@/types';

/**
 * Formats a number as Nigerian Naira (₦)
 * Example: 1500000 -> "₦1,500,000"
 */
export function formatNaira(amount: number): string {
  if (Number.isNaN(amount) || amount === null || amount === undefined) {
    return '₦0';
  }
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

/**
 * Calculates a Pay Small Small instalment plan for an eligible product.
 * Example: Luxury 6x6 Upholstered Bed
 * Full price: ₦1,500,000 | Initial deposit: ₦500,000 | Remaining balance: ₦1,000,000
 */
export function calculatePaySmallSmall(
  fullPrice: number,
  durationMonths: number,
  depositPercentage: number = 33.3333,
  fixedDepositAmount?: number
): InstalmentCalculation {
  const safeDuration = Math.max(1, durationMonths);
  const initialDeposit =
    typeof fixedDepositAmount === 'number' && fixedDepositAmount > 0
      ? Math.round(fixedDepositAmount)
      : Math.round((fullPrice * depositPercentage) / 100);

  const remainingBalance = Math.max(0, fullPrice - initialDeposit);
  const monthlyInstalment = Math.round(remainingBalance / safeDuration);

  const schedule: InstalmentScheduleItem[] = [
    {
      instalmentNumber: 0,
      dueDateLabel: 'Today (Initial Deposit to Commence Order)',
      amount: initialDeposit,
      status: 'INITIAL_DEPOSIT',
    },
  ];

  let allocated = 0;
  for (let i = 1; i <= safeDuration; i++) {
    const isLast = i === safeDuration;
    const amount = isLast ? remainingBalance - allocated : monthlyInstalment;
    allocated += amount;
    schedule.push({
      instalmentNumber: i,
      dueDateLabel: `Month ${i} (${i * 30} Days Post-Approval)`,
      amount,
      status: 'SCHEDULED',
    });
  }

  const effectivePercent = Math.round((initialDeposit / fullPrice) * 100);

  return {
    fullPrice,
    depositPercentage: effectivePercent,
    initialDeposit,
    remainingBalance,
    durationMonths: safeDuration,
    monthlyInstalment,
    schedule,
  };
}

/**
 * Generates an official CAF Interiors WhatsApp deep link (+234 903 026 2160)
 */
export function getWhatsAppUrl(message: string): string {
  const phone = '2349030262160';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

