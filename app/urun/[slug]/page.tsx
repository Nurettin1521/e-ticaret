import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Language } from "@/lib/i18n";
import { getProductBySlug } from "@/lib/products.server";
import { siteConfig, siteUrl } from "@/lib/site-config";
import { SiteFooter } from "@/components/site-footer";
import { DetailPageHeader } from "@/components/detail-page-header";
import { AddToCartButton } from "@/components/add-to-cart-button";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

const categoryLabelMap = {
  accessory: { tr: "Aksesuar", en: "Accessory" },
  bed: { tr: "Yatak", en: "Bed" },
  food: { tr: "Mama", en: "Food" },
  grooming: { tr: "Bakim", en: "Grooming" },
  habitat: { tr: "Yasam Alani", en: "Habitat" },
  hygiene: { tr: "Hijyen", en: "Hygiene" },
  toy: { tr: "Oyuncak", en: "Toy" },
} as const;

const petTypeLabelMap = {
  bird: { tr: "Kus", en: "Bird" },
  cat: { tr: "Kedi", en: "Cat" },
  dog: { tr: "Kopek", en: "Dog" },
  rodent: { tr: "Kemirgen", en: "Rodent" },
} as const;

const content = {
  tr: {
    back: "Ana Sayfaya Don",
    details: "Urun Detayi",
    category: "Kategori",
    petType: "Pet Type",
    stock: "Stok",
    rating: "Puan",
    reviews: "yorum",
    oldPrice: "Eski fiyat",
    inspect: "Incele",
    addToCart: "Sepete Ekle",
  },
  en: {
    back: "Back to Home",
    details: "Product Detail",
    category: "Category",
    petType: "Pet Type",
    stock: "Stock",
    rating: "Rating",
    reviews: "reviews",
    oldPrice: "Old price",
    inspect: "View",
    addToCart: "Add to Cart",
  },
};

const resolveLanguage = (langValue?: string): Language => (langValue === "en" ? "en" : "tr");

export async function generateMetadata({ params, searchParams }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const language = resolveLanguage(lang);
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: `${siteConfig.name} | Urun bulunamadi`,
    };
  }

  const title = `${product.name[language]} | ${siteConfig.name}`;
  const description = product.shortDescription[language];
  const path = `/urun/${product.slug}?lang=${language}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const language = resolveLanguage(lang);
  const t = content[language];

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const priceFormatter = new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  });

  const categoryLabel =
    categoryLabelMap[product.category as keyof typeof categoryLabelMap]?.[language] ?? product.category;
  const petTypeLabel = petTypeLabelMap[product.petType as keyof typeof petTypeLabelMap]?.[language] ?? product.petType;
  const currentUrl = `${siteUrl}/urun/${product.slug}?lang=${language}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[language],
    description: product.shortDescription[language],
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "TRY",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: currentUrl,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <DetailPageHeader language={language} />

      <main className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <Link
            href={`/?lang=${language}`}
            className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
          >
            ← {t.back}
          </Link>

          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white">
            <div className="grid gap-0 md:grid-cols-[1fr_1fr]">
              <div className="h-64 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 p-6 md:h-full">
                <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {product.badge[language]}
                </span>
              </div>

              <div className="space-y-5 p-6 md:p-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">{t.details}</p>
                  <h1 className="mt-2 text-2xl font-semibold text-zinc-900 md:text-3xl">{product.name[language]}</h1>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{product.shortDescription[language]}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    {t.category}: {categoryLabel}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">
                    {t.petType}: {petTypeLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <p className="text-3xl font-bold text-emerald-700">{priceFormatter.format(product.price)}</p>
                  <p className="text-sm text-zinc-500 line-through">
                    {t.oldPrice}: {priceFormatter.format(product.compareAtPrice)}
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
                  <p>
                    <span className="font-semibold text-zinc-900">{t.stock}:</span> {product.stock}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">{t.rating}:</span> {product.rating} / 5
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">{product.reviewCount}</span> {t.reviews}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                  >
                    {t.inspect}
                  </button>
                  <AddToCartButton
                    language={language}
                    productId={product.id}
                    label={t.addToCart}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter
        language={language}
        homeHref={`/?lang=${language}`}
        categoriesHref={`/?lang=${language}#categories`}
        dealsHref={`/?lang=${language}#deals`}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    </div>
  );
}
