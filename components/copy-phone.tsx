"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  phone: string;
  className?: string;
}

export function CopyPhone({ phone, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(phone);
    setCopied(true);
    toast.success("Kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1 group hover:text-blue-600 transition-colors ${className}`}
      title="Kopyala"
      type="button"
    >
      <span>{phone}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
      )}
    </button>
  );
}
