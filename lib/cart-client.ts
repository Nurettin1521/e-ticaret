"use client";

export type CartItem = {
  productId: number;
  quantity: number;
};

const CART_STORAGE_PREFIX = "patishop_cart_";
export const CART_CHANGE_EVENT = "patishop-cart-change";
const EMPTY_CART: CartItem[] = [];
const cartSnapshotCache = new Map<string, { raw: string | null; parsed: CartItem[] }>();

function getCartStorageKey(email: string) {
  const normalized = email.trim().toLowerCase();
  return `${CART_STORAGE_PREFIX}${normalized}`;
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) => item && Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function getCartItemsForUser(email?: string) {
  if (typeof window === "undefined" || !email) return EMPTY_CART;
  const key = getCartStorageKey(email);
  return parseCart(window.localStorage.getItem(key));
}

export function getCartItemsSnapshotForUser(email?: string) {
  if (typeof window === "undefined" || !email) return EMPTY_CART;

  const key = getCartStorageKey(email);
  const raw = window.localStorage.getItem(key);
  const cached = cartSnapshotCache.get(key);

  if (cached && cached.raw === raw) {
    return cached.parsed;
  }

  const parsed = parseCart(raw);
  cartSnapshotCache.set(key, { raw, parsed });
  return parsed;
}

function setCartItemsForUser(email: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  const key = getCartStorageKey(email);
  window.localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function addProductToCart(email: string, productId: number, quantity = 1) {
  if (!email || quantity <= 0) return;

  const items = getCartItemsForUser(email);
  const existingIndex = items.findIndex((item) => item.productId === productId);

  if (existingIndex >= 0) {
    const next = [...items];
    next[existingIndex] = {
      ...next[existingIndex],
      quantity: next[existingIndex].quantity + quantity,
    };
    setCartItemsForUser(email, next);
    return;
  }

  setCartItemsForUser(email, [...items, { productId, quantity }]);
}

export function removeProductFromCart(email: string, productId: number) {
  if (!email) return;
  const items = getCartItemsForUser(email).filter((item) => item.productId !== productId);
  setCartItemsForUser(email, items);
}

export function clearCartForUser(email: string) {
  if (!email) return;
  setCartItemsForUser(email, []);
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
