"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n";
import type { LocalizedText } from "@/lib/product-types";

type AdminOrdersManagerProps = {
  language: Language;
};

type OrderStatus = "new" | "shipped" | "delivered";
type OrderRecord = {
  id: number;
  createdAt: string;
  address: string;
  phone: string;
  paymentMethod: string;
  status: OrderStatus;
  subtotal: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: {
    productId: number;
    name: LocalizedText;
    quantity: number;
    price: number;
  }[];
};

const content = {
  tr: {
    title: "Siparis Yonetimi",
    subtitle: "Siparisleri durumuna gore yonet.",
    newTab: "Beklemedeki Siparisler",
    shippedTab: "Kargoya Verilenler",
    deliveredTab: "Teslim Edilenler",
    loading: "Siparisler yukleniyor...",
    noOrders: "Bu durumda siparis yok.",
    moveToShipped: "Kargoya Ver",
    moveToDelivered: "Teslim Edildi Olarak Isaretle",
    date: "Tarih",
    customer: "Musteri",
    payment: "Odeme",
    address: "Adres",
    phone: "Telefon",
    total: "Toplam",
    items: "Urunler",
    saveError: "Durum guncellenemedi.",
  },
  en: {
    title: "Order Management",
    subtitle: "Manage orders by their status.",
    newTab: "Pending Orders",
    shippedTab: "Shipped Orders",
    deliveredTab: "Delivered Orders",
    loading: "Loading orders...",
    noOrders: "No orders in this status.",
    moveToShipped: "Mark as Shipped",
    moveToDelivered: "Mark as Delivered",
    date: "Date",
    customer: "Customer",
    payment: "Payment",
    address: "Address",
    phone: "Phone",
    total: "Total",
    items: "Items",
    saveError: "Status could not be updated.",
  },
} as const;

export function AdminOrdersManager({ language }: AdminOrdersManagerProps) {
  const t = content[language];
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>("new");
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; orders?: OrderRecord[] }
          | null;
        if (cancelled || !response.ok || !data?.ok || !Array.isArray(data.orders)) return;
        setOrders(data.orders);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = orders.filter((order) => order.status === activeTab);

  const updateOrderStatus = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setActionError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: nextStatus,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; order?: OrderRecord }
        | null;

      if (!response.ok || !data?.ok || !data.order) {
        setActionError(t.saveError);
        return;
      }

      setOrders((prev) =>
        prev.map((order) => (order.id === data.order!.id ? data.order! : order)),
      );
    } catch {
      setActionError(t.saveError);
    } finally {
      setUpdatingId(null);
    }
  };

  const tabClass = (status: OrderStatus) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      activeTab === status
        ? "bg-emerald-500 text-white"
        : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
    }`;

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4 md:p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{t.title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t.subtitle}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("new")} className={tabClass("new")}>
          {t.newTab}
        </button>
        <button type="button" onClick={() => setActiveTab("shipped")} className={tabClass("shipped")}>
          {t.shippedTab}
        </button>
        <button type="button" onClick={() => setActiveTab("delivered")} className={tabClass("delivered")}>
          {t.deliveredTab}
        </button>
      </div>

      {actionError ? <p className="text-sm font-medium text-rose-600">{actionError}</p> : null}

      {isLoading ? (
        <p className="text-sm text-zinc-600">{t.loading}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-sm text-zinc-600">{t.noOrders}</p>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-zinc-100 bg-white p-4">
              <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                <p>
                  <span className="font-semibold"># {order.id}</span>
                </p>
                <p>
                  <span className="font-semibold">{t.date}:</span>{" "}
                  {new Date(order.createdAt).toLocaleString(language === "tr" ? "tr-TR" : "en-US")}
                </p>
                <p>
                  <span className="font-semibold">{t.customer}:</span> {order.user.name} ({order.user.email})
                </p>
                <p>
                  <span className="font-semibold">{t.payment}:</span> {order.paymentMethod}
                </p>
                <p>
                  <span className="font-semibold">{t.phone}:</span> {order.phone}
                </p>
                <p>
                  <span className="font-semibold">{t.total}:</span> {formatter.format(order.subtotal)}
                </p>
                <p className="md:col-span-2">
                  <span className="font-semibold">{t.address}:</span> {order.address}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-zinc-900">{t.items}</p>
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm">
                    <span className="text-zinc-700">
                      {item.name[language]} x {item.quantity}
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatter.format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {activeTab === "new" ? (
                <button
                  type="button"
                  onClick={() => void updateOrderStatus(order.id, "shipped")}
                  disabled={updatingId === order.id}
                  className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.moveToShipped}
                </button>
              ) : null}

              {activeTab === "shipped" ? (
                <button
                  type="button"
                  onClick={() => void updateOrderStatus(order.id, "delivered")}
                  disabled={updatingId === order.id}
                  className="mt-4 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.moveToDelivered}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
