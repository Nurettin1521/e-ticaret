import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { normalizeLocalizedText } from "@/lib/product-types";
import { getSessionUserFromRequest } from "@/lib/session.server";

type LocalizedInput = {
  tr?: string;
  en?: string;
};

type ProductPayload = {
  id?: number;
  sku?: string;
  slug?: string;
  category?: string;
  petType?: string;
  name?: LocalizedInput;
  shortDescription?: LocalizedInput;
  price?: number;
  currency?: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  badge?: LocalizedInput;
  image?: string;
  isPopular?: boolean;
  isDeal?: boolean;
};

function parseLocalizedInput(value: LocalizedInput | undefined) {
  return {
    tr: value?.tr?.trim() ?? "",
    en: value?.en?.trim() ?? "",
  };
}

function toProductDto(row: {
  id: number;
  sku: string;
  slug: string;
  category: string;
  petType: string;
  name: unknown;
  shortDescription: unknown;
  price: number;
  compareAtPrice: number;
  currency: string;
  stock: number;
  rating: number;
  reviewCount: number;
  badge: unknown;
  image: string;
  isPopular: boolean;
  isDeal: boolean;
}) {
  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    category: row.category,
    petType: row.petType,
    name: normalizeLocalizedText(row.name),
    shortDescription: normalizeLocalizedText(row.shortDescription),
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    currency: row.currency,
    stock: row.stock,
    rating: row.rating,
    reviewCount: row.reviewCount,
    badge: normalizeLocalizedText(row.badge),
    image: row.image,
    isPopular: row.isPopular,
    isDeal: row.isDeal,
  };
}

async function requireAdmin(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user?.isAdmin) return null;
  return user;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const rows = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    ok: true,
    products: rows.map(toProductDto),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let payload: ProductPayload;
  try {
    payload = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const name = parseLocalizedInput(payload.name);
  const shortDescription = parseLocalizedInput(payload.shortDescription);
  const badge = parseLocalizedInput(payload.badge);
  const sku = payload.sku?.trim() ?? "";
  const slug = payload.slug?.trim() ?? "";
  const category = payload.category?.trim() ?? "";
  const petType = payload.petType?.trim() ?? "";
  const price = Number(payload.price ?? 0);
  const stock = Number(payload.stock ?? 0);
  const rating = Number(payload.rating ?? 0);
  const reviewCount = Number(payload.reviewCount ?? 0);

  if (
    !sku ||
    !slug ||
    !category ||
    !petType ||
    !name.tr ||
    !name.en ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const maxId = await tx.product.aggregate({
        _max: { id: true },
      });

      return tx.product.create({
        data: {
          id: (maxId._max.id ?? 0) + 1,
          sku,
          slug,
          category,
          petType,
          name,
          shortDescription,
          price: Math.round(price),
          compareAtPrice: Math.round(price),
          currency: payload.currency?.trim() || "TRY",
          stock: Math.floor(stock),
          rating: Math.max(0, Math.min(5, rating)),
          reviewCount: Math.max(0, Math.floor(reviewCount)),
          badge,
          image: payload.image?.trim() || "/globe.svg",
          isPopular: Boolean(payload.isPopular),
          isDeal: Boolean(payload.isDeal),
        },
      });
    });

    return NextResponse.json({
      ok: true,
      product: toProductDto(created),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, error: "UNIQUE_CONFLICT" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "CREATE_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let payload: ProductPayload;
  try {
    payload = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const id = payload.id;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof payload.sku === "string") data.sku = payload.sku.trim();
  if (typeof payload.slug === "string") data.slug = payload.slug.trim();
  if (typeof payload.category === "string") data.category = payload.category.trim();
  if (typeof payload.petType === "string") data.petType = payload.petType.trim();
  if (payload.name) data.name = parseLocalizedInput(payload.name);
  if (payload.shortDescription) data.shortDescription = parseLocalizedInput(payload.shortDescription);
  if (typeof payload.price === "number") {
    const roundedPrice = Math.max(0, Math.round(payload.price));
    data.price = roundedPrice;
    data.compareAtPrice = roundedPrice;
  }
  if (typeof payload.currency === "string") data.currency = payload.currency.trim() || "TRY";
  if (typeof payload.stock === "number") data.stock = Math.max(0, Math.floor(payload.stock));
  if (typeof payload.rating === "number") data.rating = Math.max(0, Math.min(5, payload.rating));
  if (typeof payload.reviewCount === "number") data.reviewCount = Math.max(0, Math.floor(payload.reviewCount));
  if (payload.badge) data.badge = parseLocalizedInput(payload.badge);
  if (typeof payload.image === "string") data.image = payload.image.trim() || "/globe.svg";
  if (typeof payload.isPopular === "boolean") data.isPopular = payload.isPopular;
  if (typeof payload.isDeal === "boolean") data.isDeal = payload.isDeal;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: false, error: "NO_FIELDS" }, { status: 400 });
  }

  try {
    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ok: true,
      product: toProductDto(updated),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ ok: false, error: "UNIQUE_CONFLICT" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
    }
    return NextResponse.json({ ok: false, error: "UPDATE_FAILED" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let payload: ProductPayload;
  try {
    payload = (await request.json()) as ProductPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const id = payload.id;
  if (!Number.isInteger(id)) {
    return NextResponse.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json({ ok: false, error: "PRODUCT_IN_USE" }, { status: 409 });
      }
    }
    return NextResponse.json({ ok: false, error: "DELETE_FAILED" }, { status: 500 });
  }
}
