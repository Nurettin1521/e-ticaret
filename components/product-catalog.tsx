"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Language } from "@/lib/i18n";
import type { LocalizedText, Product } from "@/lib/product-types";
import { AddToCartButton } from "@/components/add-to-cart-button";

const ITEMS_PER_PAGE = 12;

const categoryLabelMap: Record<string, LocalizedText> = {
  accessory: { tr: "Aksesuar", en: "Accessory" },
  bed: { tr: "Yatak", en: "Bed" },
  food: { tr: "Mama", en: "Food" },
  grooming: { tr: "Bakim", en: "Grooming" },
  habitat: { tr: "Yasam Alani", en: "Habitat" },
  hygiene: { tr: "Hijyen", en: "Hygiene" },
  toy: { tr: "Oyuncak", en: "Toy" },
};

const petTypeLabelMap: Record<string, LocalizedText> = {
  bird: { tr: "Kus", en: "Bird" },
  cat: { tr: "Kedi", en: "Cat" },
  dog: { tr: "Kopek", en: "Dog" },
  rodent: { tr: "Kemirgen", en: "Rodent" },
};

const content = {
  tr: {
    sectionTag: "Urun Katalogu",
    title: "Tum urunler",
    subtitle: "Filtrelerle urunleri daraltabilirsin.",
    filtersTitle: "Filtreler",
    clearFilters: "Temizle",
    category: "Kategori",
    petType: "Pet Type",
    priceRange: "Fiyat Araligi",
    minPrice: "Min fiyat",
    maxPrice: "Maks fiyat",
    showing: "urun gosteriliyor",
    showFilters: "Filtreleri Goster",
    hideFilters: "Filtreleri Gizle",
    previousPage: "Onceki",
    nextPage: "Sonraki",
    page: "Sayfa",
    noResultTitle: "Urun bulunamadi",
    noResultDescription: "Secili filtrelerde urun yok. Filtreleri sifirlayip tekrar dene.",
    stock: "Stok",
    inspect: "Incele",
    addToCart: "Sepete Ekle",
    reviews: "yorum",
    per: " / ",
    loading: "Urunler yukleniyor...",
  },
  en: {
    sectionTag: "Product Catalog",
    title: "All products",
    subtitle: "Use filters to narrow down products.",
    filtersTitle: "Filters",
    clearFilters: "Clear",
    category: "Category",
    petType: "Pet Type",
    priceRange: "Price Range",
    minPrice: "Min price",
    maxPrice: "Max price",
    showing: "products shown",
    showFilters: "Show Filters",
    hideFilters: "Hide Filters",
    previousPage: "Previous",
    nextPage: "Next",
    page: "Page",
    noResultTitle: "No products found",
    noResultDescription: "There is no product for selected filters. Reset filters and try again.",
    stock: "Stock",
    inspect: "View",
    addToCart: "Add to Cart",
    reviews: "reviews",
    per: " / ",
    loading: "Loading products...",
  },
};

type ProductCatalogProps = {
  language: Language;
};

export function ProductCatalog({ language }: ProductCatalogProps) {
  const t = content[language];

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const data = (await response.json()) as { products?: Product[] };
        if (cancelled || !Array.isArray(data.products)) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        setProducts(data.products);
        if (data.products.length > 0) {
          const minPrice = Math.min(...data.products.map((product) => product.price));
          const maxPrice = Math.max(...data.products.map((product) => product.price));
          setPriceMin(minPrice);
          setPriceMax(maxPrice);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const petTypeOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.petType))).sort(),
    [products],
  );

  const absoluteMinPrice = useMemo(
    () => (products.length > 0 ? Math.min(...products.map((product) => product.price)) : 0),
    [products],
  );
  const absoluteMaxPrice = useMemo(
    () => (products.length > 0 ? Math.max(...products.map((product) => product.price)) : 0),
    [products],
  );

  const formatter = new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });

  const toggleFilterValue = (
    value: string,
    selectedValues: string[],
    setter: (next: string[]) => void,
  ) => {
    setCurrentPage(1);

    if (selectedValues.includes(value)) {
      setter(selectedValues.filter((item) => item !== value));
      return;
    }

    setter([...selectedValues, value]);
  };

  const filteredProducts = products.filter((product) => {
    const categoryOk = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const petTypeOk = selectedPetTypes.length === 0 || selectedPetTypes.includes(product.petType);
    const priceOk = product.price >= priceMin && product.price <= priceMax;
    return categoryOk && petTypeOk && priceOk;
  });

  const categoryCountMap: Record<string, number> = {};
  for (const category of categoryOptions) {
    categoryCountMap[category] = products.filter((product) => {
      const petTypeOk = selectedPetTypes.length === 0 || selectedPetTypes.includes(product.petType);
      const priceOk = product.price >= priceMin && product.price <= priceMax;
      return petTypeOk && priceOk && product.category === category;
    }).length;
  }

  const petTypeCountMap: Record<string, number> = {};
  for (const petType of petTypeOptions) {
    petTypeCountMap[petType] = products.filter((product) => {
      const categoryOk = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      const priceOk = product.price >= priceMin && product.price <= priceMax;
      return categoryOk && priceOk && product.petType === petType;
    }).length;
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE,
  );

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedPetTypes([]);
    setPriceMin(absoluteMinPrice);
    setPriceMax(absoluteMaxPrice);
    setCurrentPage(1);
  };

  const filterPanel = (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-900">{t.filtersTitle}</h3>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:border-emerald-300 hover:text-emerald-700"
        >
          {t.clearFilters}
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-900">{t.priceRange}</h4>
          <p className="text-sm font-medium text-emerald-700">
            {formatter.format(priceMin)} - {formatter.format(priceMax)}
          </p>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500">{t.minPrice}</label>
            <input
              type="range"
              min={absoluteMinPrice}
              max={absoluteMaxPrice}
              value={priceMin}
              onChange={(event) => {
                const next = Number(event.target.value);
                setCurrentPage(1);
                setPriceMin(Math.min(next, priceMax));
              }}
              className="w-full accent-emerald-500"
              disabled={products.length === 0}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-500">{t.maxPrice}</label>
            <input
              type="range"
              min={absoluteMinPrice}
              max={absoluteMaxPrice}
              value={priceMax}
              onChange={(event) => {
                const next = Number(event.target.value);
                setCurrentPage(1);
                setPriceMax(Math.max(next, priceMin));
              }}
              className="w-full accent-emerald-500"
              disabled={products.length === 0}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-900">{t.category}</h4>
          <div className="space-y-2">
            {categoryOptions.map((category) => {
              const label = categoryLabelMap[category]?.[language] ?? category;
              const count = categoryCountMap[category] ?? 0;
              const checked = selectedCategories.includes(category);

              return (
                <label
                  key={category}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-1 transition-colors hover:border-emerald-100 hover:bg-emerald-50/40"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilterValue(category, selectedCategories, setSelectedCategories)}
                      className="h-4 w-4 rounded border-zinc-300 accent-emerald-500"
                    />
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-900">{t.petType}</h4>
          <div className="space-y-2">
            {petTypeOptions.map((petType) => {
              const label = petTypeLabelMap[petType]?.[language] ?? petType;
              const count = petTypeCountMap[petType] ?? 0;
              const checked = selectedPetTypes.includes(petType);

              return (
                <label
                  key={petType}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-1 transition-colors hover:border-emerald-100 hover:bg-emerald-50/40"
                >
                  <span className="flex items-center gap-2 text-sm text-zinc-700">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFilterValue(petType, selectedPetTypes, setSelectedPetTypes)}
                      className="h-4 w-4 rounded border-zinc-300 accent-emerald-500"
                    />
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">{count}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section id="categories" className="space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-4 md:p-6 lg:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{t.sectionTag}</p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900 md:text-3xl">{t.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
          <p className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
            {paginatedProducts.length} / {filteredProducts.length} {t.showing}
          </p>
        </div>

        <div className="mt-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
            aria-expanded={isMobileFiltersOpen}
            className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            {isMobileFiltersOpen ? t.hideFilters : t.showFilters}
          </button>

          {isMobileFiltersOpen ? (
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4">{filterPanel}</div>
          ) : null}
        </div>

        <div className="mt-6 grid items-start gap-5 md:grid-cols-[18rem_1fr] lg:gap-7">
          <aside className="hidden rounded-3xl border border-emerald-100 bg-[#fcfffd] p-5 md:block">{filterPanel}</aside>

          <div className="flex flex-col rounded-3xl border border-emerald-100 bg-[#fcfffd] p-4 md:h-[820px] md:overflow-y-auto md:p-5">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center">
                <p className="text-sm font-semibold text-zinc-700">{t.loading}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-8 text-center">
                <p className="text-lg font-semibold text-zinc-900">{t.noResultTitle}</p>
                <p className="mt-2 text-sm text-zinc-500">{t.noResultDescription}</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => {
                  const categoryLabel = categoryLabelMap[product.category]?.[language] ?? product.category;
                  const petTypeLabel = petTypeLabelMap[product.petType]?.[language] ?? product.petType;

                  return (
                    <article key={product.id} className="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
                      <div className="h-28 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 p-4">
                        <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700">
                          {product.badge[language]}
                        </span>
                      </div>
                      <div className="space-y-3 p-4">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{categoryLabel}</span>
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">{petTypeLabel}</span>
                        </div>

                        <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">{product.name[language]}</h3>
                        <p className="line-clamp-2 text-sm text-zinc-500">{product.shortDescription[language]}</p>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold text-emerald-700">{formatter.format(product.price)}</p>
                          </div>
                          <div className="text-right text-xs text-zinc-500">
                            <p>
                              {product.rating}
                              {t.per}5
                            </p>
                            <p>
                              {product.reviewCount} {t.reviews}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs font-medium text-zinc-500">
                          {t.stock}: {product.stock}
                        </p>

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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-700"
            >
              {t.previousPage}
            </button>

            <p className="text-sm font-semibold text-zinc-700">
              {t.page} {safeCurrentPage} / {totalPages}
            </p>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-emerald-300 hover:text-emerald-700"
            >
              {t.nextPage}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
