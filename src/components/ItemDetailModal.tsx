import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalItem {
  product_name: string;
  image?: string | null;
  description?: string;
  sizes: { label: string; price: number }[];
}

interface Props {
  item: ModalItem | null;
  onClose: () => void;
}

export default function ItemDetailModal({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [item, onClose]);

  if (!item) return null;

  const hasSingleSize = item.sizes.length === 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/60 z-10" />

        {/* Image or placeholder */}
        {item.image ? (
          <div className="h-52 w-full  overflow-hidden">
            <img
              src={item.image}
              alt={item.product_name}
              className="h-full mx-auto object-cover"
            />
          </div>
        ) : (
          <div className="h-32 w-full bg-gray-100 flex items-center justify-center text-5xl font-bold text-gray-300">
            {(item.product_name || "?")[0]}
          </div>
        )}

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60 transition-colors"
          aria-label="Zatvori"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-5 pb-8 sm:pb-5">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{item.product_name}</h2>

          {item.description && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.description}</p>
          )}

          {/* Prices */}
          <div className="mt-4 rounded-2xl bg-[#C41E3A]/10 p-4 space-y-2">
            {item.sizes.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                {!hasSingleSize && s.label && (
                  <span className="text-sm font-medium text-gray-700">{s.label}</span>
                )}
                <span className={`text-lg font-bold text-[#C41E3A] ${hasSingleSize ? "w-full text-center" : ""}`}>
                  {s.price.toFixed(2)} €
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
