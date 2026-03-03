import { useLanguage } from "../context/LanguageContext";

interface FeaturedStripProps {
  title: string;
  badge: string;
  items: any[];
}

export default function FeaturedStrip({ title, badge, items }: FeaturedStripProps) {
  const { getProductTranslation } = useLanguage();

  return (
    <section>
      <h2 className="text-lg font-bold tracking-wide text-gray-900 mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative flex-none w-44 sm:w-52 rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden snap-start"
          >
            {/* Badge */}
            <div className="absolute top-2 right-2 z-10 bg-[#C41E3A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {badge}
            </div>

            {/* Slika */}
            {item.image ? (
              <img
                src={item.image}
                alt=""
                aria-hidden="true"
                className="h-28 w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-28 w-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-300">
                {(item.product_name || "?")[0]}
              </div>
            )}

            {/* Info */}
            <div className="p-3">
              <div className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
                {getProductTranslation(item, "product_name")}
              </div>
              <div className="mt-1.5 text-sm font-bold text-[#C41E3A]">
                {Number(item.price).toFixed(2)} €
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
