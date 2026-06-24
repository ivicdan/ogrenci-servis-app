import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TR_MAP: Record<string, string> = {
  i: "İ", ı: "I", ş: "Ş", ç: "Ç", ğ: "Ğ", ü: "Ü", ö: "Ö",
};

export function trUpperCase(str: string): string {
  return str.replace(/[iışçğüö]/g, (c) => TR_MAP[c] ?? c).toUpperCase();
}
