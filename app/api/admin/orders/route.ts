import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeLocalizedText } from "@/lib/product-types";
import { getSessionUserFromRequest } from "@/lib/session.server";

const ORDER_STATUSES = ["new", "shipped", "delivered"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

type OrderStatusPayload = {
  id?: number;
  status?: OrderStatus;
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

function toOrderDto(order: {
  id: number;
  address: string;
  phone: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  createdAt: Date;
  user: { id: number; name: string; email: string };
  items: {
    productId: number;
    productName: unknown;
    quantity: number;
    price: number;
  }[];
}) {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    address: order.address,
    phone: order.phone,
    paymentMethod: order.paymentMethod,
    status: order.status,
    subtotal: order.subtotal,
    user: order.user,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: normalizeLocalizedText(item.productName),
      quantity: item.quantity,
      price: item.price,
    })),
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

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const where = isOrderStatus(statusFilter) ? { status: statusFilter } : undefined;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  let payload: OrderStatusPayload;
  try {
    payload = (await request.json()) as OrderStatusPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  if (!Number.isInteger(payload.id) || !isOrderStatus(payload.status)) {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const current = await prisma.order.findUnique({
    where: { id: payload.id },
    select: { id: true, status: true },
  });

  if (!current) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const validTransition =
    (current.status === "new" && payload.status === "shipped") ||
    (current.status === "shipped" && payload.status === "delivered") ||
    current.status === payload.status;

  if (!validTransition) {
    return NextResponse.json({ ok: false, error: "INVALID_TRANSITION" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: payload.id },
    data: {
      status: payload.status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
    order: toOrderDto(updated),
  });
}
