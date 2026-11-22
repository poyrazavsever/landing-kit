import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const money = (whole) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });

/** ₺150 for whole amounts, ₺149,90 otherwise. */
export function formatPrice(value) {
  if (value === null || value === undefined) return '';
  return money(Math.round(value * 100) % 100 === 0).format(value);
}

export function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
