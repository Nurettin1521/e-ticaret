"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { Product } from "@/lib/product-types";
const toneClasses = [
  "from-emerald-100 to-cyan-100",
  "from-sky-100 to-indigo-100",
  "from-amber-100 to-orange-100",
  "from-fuchsia-100 to-rose-100",
  "from-lime-100 to-emerald-100",
  "from-violet-100 to-purple-100",
  "from-teal-100 to-emerald-100",
  "from-yellow-100 to-amber-100",
  "from-orange-100 to-rose-100",
  "from-cyan-100 to-sky-100",
];

const content = {
  tr: {
    sectionTag: "Popüler Ürünler",
    title: "En çok tercih edilen ürünler",
    previous: "Geri",
    next: "Ileri",
    inspect: "Incele",
    addToCart: "Sepete Ekle",
  },
  en: {
    sectionTag: "Popular Products",
    title: "Most preferred products",
    previous: "Back",
    next: "Next",
    inspect: "View",
    addToCart: "Add to Cart",
  },
};

type PopularProductsCarouselProps = {
  language: Language;
};

export function PopularProductsCarousel({ language }: PopularProductsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const t = content[language];
  const formatter = new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });

  const scrollByDirection = useCallback((direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>("[data-popular-card]");
    if (!card) return;

    const gap = Number.parseFloat(getComputedStyle(container).gap || "0");
    const step = card.offsetWidth + gap;
    const maxLeft = container.scrollWidth - container.clientWidth;

    if (direction === 1) {
      const nextLeft = container.scrollLeft + step;
      if (nextLeft >= maxLeft - 4) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      container.scrollTo({ left: nextLeft, behavior: "smooth" });
      return;
    }

    const prevLeft = container.scrollLeft - step;
    if (prevLeft <= 0) {
      container.scrollTo({ left: maxLeft, behavior: "smooth" });
      return;
    }
    container.scrollTo({ left: prevLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      scrollByDirection(1);
    }, 5000);

    return () => clearInterval(timer);
  }, [scrollByDirection]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products?popular=1", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { products?: Product[] };
        if (cancelled || !Array.isArray(data.products)) return;

        setPopularProducts(data.products);
      } catch {
        // no-op: leave carousel empty on network errors in dev/mobile access
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="deals" className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{t.sectionTag}</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900 md:text-3xl">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByDirection(-1)}
            aria-label={t.previous}
            className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection(1)}
            aria-label={t.next}
            className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {popularProducts.map((product, index) => (
          <article
            key={product.id}
            data-popular-card
            className="min-w-[260px] snap-start overflow-hidden rounded-3xl border border-emerald-100 bg-white md:min-w-[290px]"
          >
            <div className={`h-32 bg-gradient-to-br ${toneClasses[index % toneClasses.length]} p-4`}>
              <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700">
                {product.badge[language]}
              </span>
            </div>
            <div className="space-y-2 p-4">
              <h2 className="text-base font-semibold text-zinc-900">{product.name[language]}</h2>
              <p className="text-sm text-zinc-500">{product.shortDescription[language]}</p>
              <p className="pt-1 text-lg font-bold text-emerald-700">{formatter.format(product.price)}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/urun/${product.slug}?lang=${language}`}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                >
                  {t.inspect}
                </Link>
                <AddToCartButton
                  language={language}
                  productId={product.id}
                  label={t.addToCart}
                  className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
