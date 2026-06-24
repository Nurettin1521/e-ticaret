import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/site-config";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const baseUrl = trimTrailingSlash(siteUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await prisma.product.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { id: "asc" },
  });

  const productItems = products.flatMap((product) => [
    {
      url: `${baseUrl}/urun/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/urun/${product.slug}?lang=en`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ]);

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/?lang=en`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...productItems,
  ];
}
