"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/lib/i18n";
import {
  hydrateAuthUserFromSession,
  getAuthUserSnapshot,
  getServerAuthUserSnapshot,
  logoutAuthUser,
  subscribeAuthUser,
} from "@/lib/auth-client";
import {
  clearCartForUser,
  getCartItemCountForUser,
  getCartItemsSnapshotForUser,
  getServerCartCountSnapshot,
  loadCartForUser,
  removeProductFromCart,
  subscribeCart,
} from "@/lib/cart-client";
import type { Product } from "@/lib/product-types";

const content = {
  tr: {
    home: "Ana Sayfa",
    categories: "Kategoriler",
    deals: "Fırsat Ürünleri",
    profile: "Profil",
    adminPanel: "Admin Panel",
    logout: "Cikis Yap",
    language: "Dil",
    brand: "PatiShop",
    tagline: "Petshop",
    login: "Login",
    cart: "Sepet",
    cartTitle: "Sepetim",
    close: "Kapat",
    empty: "Sepetin su an bos.",
    subtotal: "Ara Toplam",
    placeOrder: "Siparis Ver",
    remove: "Kaldir",
    clear: "Sepeti Temizle",
    needLogin: "Sepetini gormek icin once giris yapmalisin.",
    goLogin: "Giris Yap",
  },
  en: {
    home: "Home",
    categories: "Categories",
    deals: "Deals",
    profile: "Profile",
    adminPanel: "Admin Panel",
    logout: "Logout",
    language: "Language",
    brand: "PatiShop",
    tagline: "Pet Shop",
    login: "Login",
    cart: "Cart",
    cartTitle: "My Cart",
    close: "Close",
    empty: "Your cart is currently empty.",
    subtotal: "Subtotal",
    placeOrder: "Place Order",
    remove: "Remove",
    clear: "Clear Cart",
    needLogin: "Please sign in to view your cart.",
    goLogin: "Sign In",
  },
};

type PetshopHeaderProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  homeHref?: string;
  categoriesHref?: string;
  dealsHref?: string;
  loginHref?: string;
  profileHref?: string;
};

export function PetshopHeader({
  language,
  onLanguageChange,
  homeHref = "#",
  categoriesHref = "#categories",
  dealsHref = "#deals",
  loginHref = "/login",
  profileHref,
}: PetshopHeaderProps) {
  const router = useRouter();
  const t = content[language];
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [productsById, setProductsById] = useState<Record<number, Product>>({});
  const authUser = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    getServerAuthUserSnapshot,
  );
  const resolvedProfileHref =
    authUser?.isAdmin ? `/admin?lang=${language}` : (profileHref ?? `/profile?lang=${language}`);
  const profileLabel = authUser?.isAdmin ? t.adminPanel : t.profile;
  const profileCartHref = `${resolvedProfileHref}${resolvedProfileHref.includes("?") ? "&" : "?"}tab=cart`;
  const cartItems = useSyncExternalStore(
    subscribeCart,
    () => getCartItemsSnapshotForUser(authUser?.email),
    () => [],
  );
  const cartCount = useSyncExternalStore(
    subscribeCart,
    () => getCartItemCountForUser(authUser?.email),
    getServerCartCountSnapshot,
  );
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }),
    [language],
  );
  useEffect(() => {
    void hydrateAuthUserFromSession();
  }, []);

  useEffect(() => {
    if (!authUser?.email) return;
    void loadCartForUser(authUser.email);
  }, [authUser?.email]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) return;

        const data = (await response.json()) as { products?: Product[] };
        if (cancelled || !Array.isArray(data.products)) return;

        const map: Record<number, Product> = {};
        for (const product of data.products) {
          map[product.id] = product;
        }

        setProductsById(map);
      } catch {
        // no-op: drawer can still open without product details
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const cartEntries = cartItems
    .map((item) => {
      const product = productsById[item.productId];
      if (!product) return null;
      return { item, product };
    })
    .filter((entry): entry is { item: (typeof cartItems)[number]; product: Product } => Boolean(entry));
  const subtotal = cartEntries.reduce((total, entry) => total + entry.product.price * entry.item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:gap-4">
            <a href={homeHref} className="order-1 flex shrink-0 items-center gap-3">
              <span className="grid h-10 w-10 place-content-center rounded-2xl bg-emerald-500 text-base font-bold text-white">
                PS
              </span>
              <span className="leading-tight">
                <strong className="block text-base text-zinc-900">{t.brand}</strong>
                <span className="block text-xs text-zinc-500">{t.tagline}</span>
              </span>
            </a>

            <div className="order-2 ml-auto flex items-center gap-2 md:ml-0 md:order-3">
              {authUser ? (
                <>
                  <Link
                    href={resolvedProfileHref}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                  >
                    {profileLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void (async () => {
                        await logoutAuthUser();
                        router.replace(`/?lang=${language}`);
                      })();
                    }}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                  >
                    {t.logout}
                  </button>
                </>
              ) : (
                <Link
                  href={loginHref}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                >
                  {t.login}
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                aria-label={t.cart}
                title={t.cart}
              >
                <span aria-hidden>🛒</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  {cartCount}
                </span>
              </button>

              <label
                htmlFor="language"
                className="hidden text-xs font-semibold uppercase tracking-wide text-zinc-500 sm:block"
              >
                {t.language}
              </label>
              <select
                id="language"
                value={language}
                onChange={(event) => onLanguageChange(event.target.value as Language)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-emerald-400"
              >
                <option value="tr">TR</option>
                <option value="en">EN</option>
              </select>
            </div>

            <nav className="order-3 flex w-full min-w-0 items-center justify-center gap-3 overflow-x-auto text-sm font-medium text-zinc-700 md:order-2 md:w-auto md:flex-1 md:gap-6">
              <a href={homeHref} className="shrink-0 transition-colors hover:text-emerald-600">
                {t.home}
              </a>
              <a href={categoriesHref} className="shrink-0 transition-colors hover:text-emerald-600">
                {t.categories}
              </a>
              <a href={dealsHref} className="shrink-0 transition-colors hover:text-emerald-600">
                {t.deals}
              </a>
              {authUser ? (
                <Link
                  href={resolvedProfileHref}
                  className="shrink-0 rounded-full border border-zinc-200 px-3 py-1.5 text-zinc-600 transition-colors hover:border-emerald-400 hover:text-emerald-700"
                >
                  {profileLabel}
                </Link>
              ) : null}
            </nav>
          </div>
        </div>
      </header>

      {isCartOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/30"
            aria-label={t.close}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                {t.cartTitle} ({cartCount})
              </h3>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
              >
                {t.close}
              </button>
            </div>

            {!authUser ? (
              <div className="flex h-full flex-col items-start justify-center gap-4 px-5 text-sm text-zinc-600">
                <p>{t.needLogin}</p>
                <Link
                  href={loginHref}
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  {t.goLogin}
                </Link>
              </div>
            ) : cartEntries.length === 0 ? (
              <div className="flex h-full items-center justify-center px-5 text-sm text-zinc-500">{t.empty}</div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {cartEntries.map((entry) => (
                    <article key={entry.product.id} className="rounded-2xl border border-emerald-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{entry.product.name[language]}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatter.format(entry.product.price)} x {entry.item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeProductFromCart(authUser.email, entry.product.id)}
                          className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:text-rose-600"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="space-y-3 border-t border-emerald-100 px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-600">{t.subtotal}</span>
                    <span className="text-base font-bold text-zinc-900">{formatter.format(subtotal)}</span>
                  </div>
                  <Link
                    href={profileCartHref}
                    onClick={() => setIsCartOpen(false)}
                    className="block w-full rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    {t.placeOrder}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void clearCartForUser(authUser.email)}
                    className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                  >
                    {t.clear}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}
