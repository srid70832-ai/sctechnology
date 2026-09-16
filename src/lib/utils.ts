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

export function formatDate(date: unknown) {
  const d = toValidDate(date);
  if (!d) return "Date unavailable";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: unknown) {
  const d = toValidDate(date);
  if (!d) return "Date unavailable";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toValidDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object" && value !== null) {
    const timestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof timestamp.toDate === "function") return toValidDate(timestamp.toDate());
    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }
  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function generateCertificateId(prefix = "HACK") {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `SCT-${prefix}-2026-${randomNum}`;
}

export function generateRegistrationNo(hackathonSlug: string) {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REG-${hackathonSlug.toUpperCase().slice(0, 4)}-${rand}`;
}
