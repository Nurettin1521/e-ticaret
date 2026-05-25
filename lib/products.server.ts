import "server-only";

import { prisma } from "@/lib/db";
import type { Product } from "@/lib/product-types";
import { normalizeLocalizedText } from "@/lib/product-types";

type DbProduct = Awaited<ReturnType<typeof prisma.product.findMany>>[number];

function toProduct(product: DbProduct): Product {
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    category: product.category,
    petType: product.petType,
    name: normalizeLocalizedText(product.name),
    shortDescription: normalizeLocalizedText(product.shortDescription),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    badge: normalizeLocalizedText(product.badge),
    image: product.image,
    isPopular: product.isPopular,
    isDeal: product.isDeal,
  };
}

export async function getAllProducts() {
  const rows = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  return rows.map(toProduct);
}

export async function getPopularProducts(limit = 10) {
  const rows = await prisma.product.findMany({
    where: { isPopular: true },
    orderBy: { id: "asc" },
    take: limit,
  });

  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string) {
  const row = await prisma.product.findUnique({
    where: { slug },
  });

  return row ? toProduct(row) : null;
}

export async function getProductById(id: number) {
  const row = await prisma.product.findUnique({
    where: { id },
  });

  return row ? toProduct(row) : null;
}
