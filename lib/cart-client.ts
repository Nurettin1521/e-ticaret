"use client";

import { clearAuthUser } from "@/lib/auth-client";

export type CartItem = {
  productId: number;
  quantity: number;
};

export const CART_CHANGE_EVENT = "patishop-cart-change";
const EMPTY_CART: CartItem[] = [];
const cartSnapshotCache = new Map<string, CartItem[]>();

type CartMutationResult =
  | { ok: true; items: CartItem[] }
  | { ok: false; error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getCartItemsForUser(email?: string) {
  if (!email) return EMPTY_CART;
  return cartSnapshotCache.get(normalizeEmail(email)) ?? EMPTY_CART;
}

export function getCartItemsSnapshotForUser(email?: string) {
  if (!email) return EMPTY_CART;
  return cartSnapshotCache.get(normalizeEmail(email)) ?? EMPTY_CART;
}

function setCartItemsForUser(email: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  cartSnapshotCache.set(normalizeEmail(email), items);
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

function normalizeItems(items: unknown): CartItem[] {
  if (!Array.isArray(items)) return [];

  return items.filter(
    (item): item is CartItem =>
      Boolean(
        item &&
          typeof item === "object" &&
          Number.isInteger((item as CartItem).productId) &&
          Number.isInteger((item as CartItem).quantity) &&
          (item as CartItem).quantity > 0,
      ),
  );
}

async function parseCartResponse(response: Response): Promise<CartMutationResult> {
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; items?: CartItem[]; error?: string }
    | null;

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "UNKNOWN_ERROR",
    };
  }

  return {
    ok: true,
    items: normalizeItems(payload.items),
  };
}

export async function loadCartForUser(email?: string) {
  if (!email || typeof window === "undefined") return;

  const normalizedEmail = normalizeEmail(email);
  try {
    const response = await fetch("/api/cart", {
      cache: "no-store",
    });
    if (response.status === 401) {
      clearAuthUser();
      setCartItemsForUser(normalizedEmail, []);
      return;
    }
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; items?: CartItem[] }
      | null;

    if (!response.ok || !payload?.ok) {
      setCartItemsForUser(normalizedEmail, []);
      return;
    }

    setCartItemsForUser(normalizedEmail, normalizeItems(payload.items));
  } catch {
    // no-op
  }
}

export async function addProductToCart(email: string, productId: number, quantity = 1) {
  if (!email || quantity <= 0) {
    return { ok: false, error: "INVALID_INPUT" } as const;
  }

  try {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        quantity,
      }),
    });

    const result = await parseCartResponse(response);
    if (!result.ok && result.error === "UNAUTHORIZED") {
      clearAuthUser();
      setCartItemsForUser(email, []);
      return result;
    }
    if (result.ok) {
      setCartItemsForUser(email, result.items);
    }
    return result;
  } catch {
    return { ok: false, error: "NETWORK_ERROR" } as const;
  }
}

export async function removeProductFromCart(email: string, productId: number) {
  if (!email) return;

  try {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });

    const result = await parseCartResponse(response);
    if (!result.ok && result.error === "UNAUTHORIZED") {
      clearAuthUser();
      setCartItemsForUser(email, []);
      return;
    }
    if (result.ok) {
      setCartItemsForUser(email, result.items);
    }
  } catch {
    // no-op
  }
}

export async function clearCartForUser(email: string) {
  if (!email) return;

  try {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await parseCartResponse(response);
    if (!result.ok && result.error === "UNAUTHORIZED") {
      clearAuthUser();
      setCartItemsForUser(email, []);
      return;
    }
    if (result.ok) {
      setCartItemsForUser(email, result.items);
    }
  } catch {
    // no-op
  }
}

export function getCartItemCountForUser(email?: string) {
  return getCartItemsForUser(email).reduce((total, item) => total + item.quantity, 0);
}

export function subscribeCart(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener(CART_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CART_CHANGE_EVENT, listener);
  };
}

export function getServerCartCountSnapshot() {
  return 0;
}
