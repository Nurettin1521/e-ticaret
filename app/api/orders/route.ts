import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { LocalizedText } from "@/lib/product-types";
import { getSessionUserFromRequest } from "@/lib/session.server";

type PlaceOrderPayload = {
  address?: string;
  phone?: string;
  paymentMethod?: string;
};

class InsufficientStockError extends Error {
  constructor(
    public readonly productId: number,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super("INSUFFICIENT_STOCK");
  }
}

function normalizeLocalizedText(value: unknown): LocalizedText {
  if (!value || typeof value !== "object") {
    return { tr: "", en: "" };
  }

  const candidate = value as Record<string, unknown>;
  return {
    tr: typeof candidate.tr === "string" ? candidate.tr : "",
    en: typeof candidate.en === "string" ? candidate.en : "",
  };
}

function toOrderDto(
  order: {
    id: number;
    createdAt: Date;
    address: string;
    phone: string;
    paymentMethod: string;
    status: string;
    subtotal: number;
    items: {
      productId: number;
      productName: unknown;
      quantity: number;
      price: number;
    }[];
  },
) {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    address: order.address,
    phone: order.phone,
    paymentMethod: order.paymentMethod,
    status: order.status,
    subtotal: order.subtotal,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: normalizeLocalizedText(item.productName),
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { id: "asc" },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          price: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    orders: orders.map(toOrderDto),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: PlaceOrderPayload;

  try {
    payload = (await request.json()) as PlaceOrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const address = payload.address?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";
  const paymentMethod = payload.paymentMethod?.trim() ?? "";

  if (!address || !phone || !paymentMethod) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  try {
    const createdOrder = await prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              id: true,
              stock: true,
              price: true,
              name: true,
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new Error("EMPTY_CART");
      }

      for (const cartItem of cartItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: cartItem.productId,
            stock: { gte: cartItem.quantity },
          },
          data: {
            stock: { decrement: cartItem.quantity },
          },
        });

        if (updated.count === 0) {
          throw new InsufficientStockError(
            cartItem.productId,
            cartItem.quantity,
            cartItem.product.stock,
          );
        }
      }

      const subtotal = cartItems.reduce(
        (total, cartItem) => total + cartItem.product.price * cartItem.quantity,
        0,
      );

      const order = await tx.order.create({
        data: {
          userId: user.id,
          address,
          phone,
          paymentMethod,
          status: "new",
          subtotal,
          items: {
            create: cartItems.map((cartItem) => ({
              product: {
                connect: { id: cartItem.productId },
              },
              productName: normalizeLocalizedText(cartItem.product.name),
              quantity: cartItem.quantity,
              price: cartItem.product.price,
            })),
          },
        },
        include: {
          items: {
            orderBy: { id: "asc" },
            select: {
              productId: true,
              productName: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return order;
    });

    return NextResponse.json({
      ok: true,
      order: toOrderDto(createdOrder),
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json(
        {
          ok: false,
          error: "INSUFFICIENT_STOCK",
          productId: error.productId,
          requested: error.requested,
          available: error.available,
        },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message === "EMPTY_CART") {
      return NextResponse.json({ ok: false, error: "EMPTY_CART" }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "ORDER_FAILED" }, { status: 500 });
  }
}
