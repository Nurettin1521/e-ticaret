import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session.server";

type CartPayload = {
  productId?: number;
  quantity?: number;
};

class InsufficientStockError extends Error {
  constructor(public readonly available: number) {
    super("INSUFFICIENT_STOCK");
  }
}

async function readCartItems(userId: number) {
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    select: {
      productId: true,
      quantity: true,
    },
  });

  return rows.map((row) => ({
    productId: row.productId,
    quantity: row.quantity,
  }));
}

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const items = await readCartItems(user.id);
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: CartPayload;

  try {
    payload = (await request.json()) as CartPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const rawProductId = payload.productId;
  const rawQuantity = payload.quantity ?? 1;

  if (
    typeof rawProductId !== "number" ||
    typeof rawQuantity !== "number" ||
    !Number.isInteger(rawProductId) ||
    !Number.isInteger(rawQuantity) ||
    rawQuantity <= 0
  ) {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  const productId = rawProductId;
  const quantity = rawQuantity;

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const existing = await tx.cartItem.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        select: { quantity: true },
      });

      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      if (nextQuantity > product.stock) {
        throw new InsufficientStockError(product.stock);
      }

      await tx.cartItem.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        create: {
          userId: user.id,
          productId,
          quantity: nextQuantity,
        },
        update: {
          quantity: nextQuantity,
        },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_STOCK",
          available: error.available,
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: false, error: "CART_UPDATE_FAILED" }, { status: 500 });
  }

  const items = await readCartItems(user.id);
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: CartPayload = {};

  try {
    payload = (await request.json()) as CartPayload;
  } catch {
    // body optional for full clear
  }

  const productId = payload.productId;

  if (Number.isInteger(productId)) {
    await prisma.cartItem.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });
  } else {
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });
  }

  const items = await readCartItems(user.id);
  return NextResponse.json({ ok: true, items });
}
