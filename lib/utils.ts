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

// Sınıf numarasını "2'nci Sınıf" formatına çevirir
export function formatSinif(value: string): string {
  const n = parseInt(value);
  if (isNaN(n) || n < 1) return value;
  const suffixMap: Record<number, string> = {
    1: "inci", 2: "nci", 3: "üncü", 4: "üncü",
    5: "inci", 6: "ncı", 7: "nci", 8: "inci",
    9: "uncu", 10: "uncu", 11: "inci", 12: "nci",
  };
  const suffix = suffixMap[n] ?? "inci";
  return `${n}'${suffix} Sınıf`;
}
