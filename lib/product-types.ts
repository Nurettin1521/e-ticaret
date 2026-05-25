export type LocalizedText = {
  tr: string;
  en: string;
};

export type Product = {
  id: number;
  sku: string;
  slug: string;
  category: string;
  petType: string;
  name: LocalizedText;
  shortDescription: LocalizedText;
  price: number;
  compareAtPrice: number;
  currency: string;
  stock: number;
  rating: number;
  reviewCount: number;
  badge: LocalizedText;
  image: string;
  isPopular: boolean;
  isDeal: boolean;
};

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.tr === "string" && typeof candidate.en === "string";
}

export function normalizeLocalizedText(value: unknown): LocalizedText {
  if (isLocalizedText(value)) {
    return value;
  }

  return { tr: "", en: "" };
}
