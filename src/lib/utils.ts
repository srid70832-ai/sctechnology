import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateCertificateId(prefix = "HACK") {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SCT-${prefix}-2026-${randomNum}`;
}

export function generateRegistrationNo(hackathonSlug: string) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REG-${hackathonSlug.toUpperCase().slice(0, 4)}-${rand}`;
}
