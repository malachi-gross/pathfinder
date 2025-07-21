// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(credits: string | null): string {
  if (!credits) return '';
  return credits.includes('-') ? `${credits} credits` : `${credits} credit${credits === '1' ? '' : 's'}`;
}

export function formatCourseId(courseId: string): string {
  return courseId.toUpperCase().replace(/\s+/g, ' ').trim();
}