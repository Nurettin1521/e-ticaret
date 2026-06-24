import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminOrdersManager } from "@/components/admin-orders-manager";
import { AdminProductsManager } from "@/components/admin-products-manager";
import { prisma } from "@/lib/db";
import { normalizeLocalizedText } from "@/lib/product-types";
import { getSessionUserFromToken, readSessionTokenFromCookieHeader } from "@/lib/session.server";

type AdminPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

const content = {
  tr: {
    title: "Admin Paneli",
    subtitle: "Urunleri ve siparisleri yonetmek icin yonetim ekrani.",
    products: "Toplam Urun",
    orders: "Toplam Siparis",
    users: "Toplam Kullanici",
    lowStock: "Dusuk Stoklu Urunler",
    stock: "Stok",
    noLowStock: "Dusuk stoklu urun bulunmuyor.",
    goStore: "Siteye Don",
    logout: "Cikis Yap",
  },
  en: {
    title: "Admin Panel",
    subtitle: "Management dashboard for products and orders.",
    products: "Total Products",
    orders: "Total Orders",
    users: "Total Users",
    lowStock: "Low Stock Products",
    stock: "Stock",
    noLowStock: "No low stock products.",
    goStore: "Back to Store",
    logout: "Logout",
  },
} as const;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { lang } = await searchParams;
  const language = lang === "en" ? "en" : "tr";
  const t = content[language];

  const cookieHeader = (await headers()).get("cookie");
  const token = readSessionTokenFromCookieHeader(cookieHeader);
  const sessionUser = token ? await getSessionUserFromToken(token) : null;

  if (!sessionUser?.isAdmin) {
    redirect(`/login?lang=${language}&mode=admin&returnTo=${encodeURIComponent(`/admin?lang=${language}`)}`);
  }

  const [productCount, orderCount, userCount, lowStockProducts] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: [{ stock: "asc" }, { id: "asc" }],
      take: 10,
      select: {
        id: true,
        name: true,
        stock: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#f7faf8] px-4 py-8 md:px-6 md:py-10">
      <section className="mx-auto w-full max-w-6xl space-y-6 rounded-3xl border border-emerald-100 bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 md:text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/?lang=${language}`}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-400 hover:text-emerald-700"
            >
              {t.goStore}
            </Link>
            <AdminLogoutButton label={t.logout} redirectHref={`/login?lang=${language}&mode=admin`} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.products}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{productCount}</p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.orders}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{orderCount}</p>
          </article>
          <article className="rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.users}</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">{userCount}</p>
          </article>
        </div>

        <section className="space-y-3 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4">
          <h2 className="text-sm font-semibold text-zinc-900">{t.lowStock}</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-zinc-600">{t.noLowStock}</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <article key={product.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2">
                  <p className="text-sm font-medium text-zinc-800">
                    {normalizeLocalizedText(product.name)[language]}
                  </p>
                  <p className="text-sm font-semibold text-rose-700">
                    {t.stock}: {product.stock}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <AdminOrdersManager language={language} />
        <AdminProductsManager language={language} />
      </section>
    </main>
  );
}
