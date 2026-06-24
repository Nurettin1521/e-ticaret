"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PetshopHeader } from "@/components/petshop-header";
import { SiteFooter } from "@/components/site-footer";
import type { Language } from "@/lib/i18n";
import {
  clearAuthUser,
  getAuthUserSnapshot,
  getServerAuthUserSnapshot,
  subscribeAuthUser,
} from "@/lib/auth-client";
import {
  getCartItemsSnapshotForUser,
  loadCartForUser,
  subscribeCart,
} from "@/lib/cart-client";
import type { Product } from "@/lib/product-types";

const content = {
  tr: {
    title: "Profil",
    subtitle: "Hesap bilgilerini, siparislerini ve sepetini buradan yonetebilirsin.",
    info: "Bilgiler",
    orders: "Siparislerim",
    cart: "Sepetim",
    fullName: "Ad Soyad",
    email: "E-posta",
    address: "Adres",
    phone: "Telefon Numarasi",
    change: "Degistir",
    save: "Kaydet",
    cancel: "Iptal",
    noValue: "Belirtilmedi",
    addressPlaceholder: "Adres bilgisini gir...",
    phonePlaceholder: "Telefon numarasini gir...",
    paymentMethod: "Odeme Yontemi",
    paymentCard: "Kredi/Banka Karti",
    paymentTransfer: "Havale/EFT",
    paymentCash: "Kapida Odeme",
    placeOrder: "Siparis Ver",
    orderFormTitle: "Siparis Bilgileri",
    orderFormError: "Lutfen tum alanlari doldur.",
    orderStockError: "Bazi urunlerde yeterli stok yok. Sepeti guncelleyip tekrar dene.",
    orderSubmitError: "Siparis olusturulamadi. Lutfen tekrar dene.",
    ordersTitle: "Olusturulan Siparisler",
    orderNo: "Siparis No",
    orderDate: "Tarih",
    orderItems: "Urunler",
    orderAddress: "Adres",
    orderPhone: "Telefon",
    orderPayment: "Odeme",
    orderStatus: "Durum",
    orderStatusNew: "Beklemede",
    orderStatusShipped: "Kargoda",
    orderStatusDelivered: "Teslim Edildi",
    orderTotal: "Toplam",
    noOrders: "Henuz olusturulmus siparis bulunmuyor.",
    loginRequiredTitle: "Profili gormek icin giris yapmalisin.",
    loginRequiredDescription: "Devam etmek icin lutfen hesabina giris yap.",
    goLogin: "Giris Yap",
    emptyCart: "Sepetin su an bos.",
    subtotal: "Ara Toplam",
  },
  en: {
    title: "Profile",
    subtitle: "Manage your account details, orders, and cart here.",
    info: "Info",
    orders: "My Orders",
    cart: "My Cart",
    fullName: "Full Name",
    email: "Email",
    address: "Address",
    phone: "Phone Number",
    change: "Change",
    save: "Save",
    cancel: "Cancel",
    noValue: "Not provided",
    addressPlaceholder: "Enter your address...",
    phonePlaceholder: "Enter your phone number...",
    paymentMethod: "Payment Method",
    paymentCard: "Credit/Debit Card",
    paymentTransfer: "Bank Transfer",
    paymentCash: "Cash on Delivery",
    placeOrder: "Place Order",
    orderFormTitle: "Order Details",
    orderFormError: "Please fill in all fields.",
    orderStockError: "Some items do not have enough stock. Update your cart and try again.",
    orderSubmitError: "Order could not be created. Please try again.",
    ordersTitle: "Created Orders",
    orderNo: "Order No",
    orderDate: "Date",
    orderItems: "Items",
    orderAddress: "Address",
    orderPhone: "Phone",
    orderPayment: "Payment",
    orderStatus: "Status",
    orderStatusNew: "Pending",
    orderStatusShipped: "Shipped",
    orderStatusDelivered: "Delivered",
    orderTotal: "Total",
    noOrders: "There are no created orders yet.",
    loginRequiredTitle: "You need to sign in to view your profile.",
    loginRequiredDescription: "Please sign in to continue.",
    goLogin: "Sign In",
    emptyCart: "Your cart is currently empty.",
    subtotal: "Subtotal",
  },
};

type TabKey = "info" | "orders" | "cart";
const resolveLanguage = (value: string | null): Language => (value === "en" ? "en" : "tr");
const resolveTab = (value: string | null): TabKey =>
  value === "orders" || value === "cart" ? value : "info";
type ProfileContent = (typeof content)["tr"];
type PaymentMethod = "card" | "transfer" | "cash";
type OrderStatus = "new" | "shipped" | "delivered";

type OrderItem = {
  productId: number;
  name: Product["name"];
  quantity: number;
  price: number;
};

type OrderRecord = {
  id: number;
  createdAt: string;
  address: string;
  phone: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
};

type OrderApiResponse = {
  ok: boolean;
  order?: OrderRecord;
  orders?: OrderRecord[];
  error?: string;
  productId?: number;
};

type ProfileDetails = {
  address: string;
  phone: string;
};

type ProfileApiResponse = {
  ok: boolean;
  profile?: ProfileDetails;
  error?: string;
};

function ProfileInfoPanel({
  t,
  user,
  details,
  onSaveAddress,
  onSavePhone,
  isSaving,
}: {
  t: ProfileContent;
  user: { name: string; email: string };
  details: ProfileDetails;
  onSaveAddress: (address: string) => Promise<boolean>;
  onSavePhone: (phone: string) => Promise<boolean>;
  isSaving: boolean;
}) {
  const [addressDraft, setAddressDraft] = useState(details.address);
  const [phoneDraft, setPhoneDraft] = useState(details.phone);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.fullName}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{user.name}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.email}</p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">{user.email}</p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.address}</p>
          <button
            type="button"
            onClick={() => {
              setAddressDraft(details.address);
              setIsEditingAddress((prev) => !prev);
            }}
            disabled={isSaving}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
          >
            {t.change}
          </button>
        </div>
        {isEditingAddress ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={addressDraft}
              onChange={(event) => setAddressDraft(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
              placeholder={t.addressPlaceholder}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const next = addressDraft.trim();
                  const saved = await onSaveAddress(next);
                  if (saved) setIsEditingAddress(false);
                }}
                disabled={isSaving}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddressDraft(details.address);
                  setIsEditingAddress(false);
                }}
                disabled={isSaving}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-zinc-900">{details.address || t.noValue}</p>
        )}
      </div>
      <div className="rounded-xl border border-emerald-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t.phone}</p>
          <button
            type="button"
            onClick={() => {
              setPhoneDraft(details.phone);
              setIsEditingPhone((prev) => !prev);
            }}
            disabled={isSaving}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
          >
            {t.change}
          </button>
        </div>
        {isEditingPhone ? (
          <div className="mt-3 space-y-2">
            <input
              type="tel"
              value={phoneDraft}
              onChange={(event) => setPhoneDraft(event.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
              placeholder={t.phonePlaceholder}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const next = phoneDraft.trim();
                  const saved = await onSavePhone(next);
                  if (saved) setIsEditingPhone(false);
                }}
                disabled={isSaving}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhoneDraft(details.phone);
                  setIsEditingPhone(false);
                }}
                disabled={isSaving}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm font-semibold text-zinc-900">{details.phone || t.noValue}</p>
        )}
      </div>
    </section>
  );
}

export function ProfileClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const language = resolveLanguage(searchParams.get("lang"));
  const initialTab = resolveTab(searchParams.get("tab"));
  const t = content[language];
  const authUser = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    getServerAuthUserSnapshot,
  );
  const cartItems = useSyncExternalStore(
    subscribeCart,
    () => getCartItemsSnapshotForUser(authUser?.email),
    () => [],
  );

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [productsById, setProductsById] = useState<Record<number, Product>>({});
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    address: "",
    phone: "",
  });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.status === 401) {
        clearAuthUser();
        setOrders([]);
        return;
      }
      const data = (await response.json().catch(() => null)) as OrderApiResponse | null;
      if (!response.ok || !data?.ok || !Array.isArray(data.orders)) return;
      setOrders(data.orders);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "tr" ? "tr" : "en";
  }, [language]);

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
        // no-op
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authUser?.email) {
      setOrders([]);
      setProfileDetails({ address: "", phone: "" });
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (response.status === 401) {
          clearAuthUser();
          if (!cancelled) {
            setProfileDetails({ address: "", phone: "" });
          }
          return;
        }
        const data = (await response.json().catch(() => null)) as ProfileApiResponse | null;
        if (cancelled || !response.ok || !data?.ok || !data.profile) return;
        setProfileDetails({
          address: data.profile.address ?? "",
          phone: data.profile.phone ?? "",
        });
      } catch {
        if (!cancelled) {
          setProfileDetails({ address: "", phone: "" });
        }
      }
    };

    void fetchOrders();
    void loadProfile();
    void loadCartForUser(authUser.email);

    return () => {
      cancelled = true;
    };
  }, [authUser?.email, fetchOrders]);

  useEffect(() => {
    if (!authUser?.email || activeTab !== "orders") return;

    void fetchOrders();
    const timer = window.setInterval(() => {
      void fetchOrders();
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeTab, authUser?.email, fetchOrders]);

  const onLanguageChange = (nextLanguage: Language) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLanguage);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 0,
      }),
    [language],
  );

  const cartEntries = cartItems
    .map((item) => {
      const product = productsById[item.productId];
      if (!product) return null;
      return { item, product };
    })
    .filter((entry): entry is { item: (typeof cartItems)[number]; product: Product } => Boolean(entry));
  const subtotal = cartEntries.reduce((total, entry) => total + entry.product.price * entry.item.quantity, 0);

  const loginHref = `/login?lang=${language}&returnTo=${encodeURIComponent(`/profile?lang=${language}`)}`;
  const paymentLabelMap: Record<PaymentMethod, string> = {
    card: t.paymentCard,
    transfer: t.paymentTransfer,
    cash: t.paymentCash,
  };
  const orderStatusLabelMap: Record<OrderStatus, string> = {
    new: t.orderStatusNew,
    shipped: t.orderStatusShipped,
    delivered: t.orderStatusDelivered,
  };

  const saveProfileDetails = async (nextDetails: ProfileDetails) => {
    if (!authUser?.email) return false;
    setIsProfileSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: nextDetails.address,
          phone: nextDetails.phone,
        }),
      });

      if (response.status === 401) {
        clearAuthUser();
        return false;
      }

      const data = (await response.json().catch(() => null)) as ProfileApiResponse | null;
      if (!response.ok || !data?.ok || !data.profile) {
        return false;
      }

      setProfileDetails({
        address: data.profile.address ?? "",
        phone: data.profile.phone ?? "",
      });
      return true;
    } catch {
      return false;
    } finally {
      setIsProfileSaving(false);
    }
  };

  const submitOrder = async () => {
    if (!authUser?.email) return;
    const address = orderAddress.trim();
    const phone = orderPhone.trim();

    if (!address || !phone || !paymentMethod || cartEntries.length === 0) {
      setOrderError(t.orderFormError);
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          phone,
          paymentMethod,
        }),
      });

      if (response.status === 401) {
        clearAuthUser();
        return;
      }

      const data = (await response.json().catch(() => null)) as OrderApiResponse | null;
      if (!response.ok || !data?.ok) {
        if (data?.error === "INSUFFICIENT_STOCK") {
          setOrderError(t.orderStockError);
        } else {
          setOrderError(t.orderSubmitError);
        }
        return;
      }

      const createdOrder = data.order;
      if (createdOrder) {
        setOrders((prev) => [createdOrder, ...prev]);
      }
    } catch {
      setOrderError(t.orderSubmitError);
      return;
    } finally {
      setIsSubmittingOrder(false);
    }

    await loadCartForUser(authUser.email);
    setIsOrderFormOpen(false);
    setOrderError("");
    setActiveTab("orders");
  };

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <PetshopHeader
        language={language}
        onLanguageChange={onLanguageChange}
        homeHref={`/?lang=${language}`}
        categoriesHref={`/?lang=${language}#categories`}
        dealsHref={`/?lang=${language}#deals`}
        loginHref={loginHref}
        profileHref={`/profile?lang=${language}`}
      />

      <main className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-emerald-100 bg-white p-5 md:p-7">
          {!authUser ? (
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-zinc-900">{t.loginRequiredTitle}</h1>
              <p className="text-sm text-zinc-600">{t.loginRequiredDescription}</p>
              <Link
                href={loginHref}
                className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                {t.goLogin}
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900">{t.title}</h1>
                <p className="mt-2 text-sm text-zinc-500">{t.subtitle}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("info")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "info"
                      ? "bg-emerald-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {t.info}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "orders"
                      ? "bg-emerald-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {t.orders}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cart")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === "cart"
                      ? "bg-emerald-500 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {t.cart}
                </button>
              </div>

              {activeTab === "info" ? (
                <ProfileInfoPanel
                  key={authUser.email}
                  t={t}
                  user={authUser}
                  details={profileDetails}
                  isSaving={isProfileSaving}
                  onSaveAddress={async (address) =>
                    saveProfileDetails({
                      address,
                      phone: profileDetails.phone,
                    })
                  }
                  onSavePhone={async (phone) =>
                    saveProfileDetails({
                      address: profileDetails.address,
                      phone,
                    })
                  }
                />
              ) : null}

              {activeTab === "orders" ? (
                <section className="rounded-2xl border border-emerald-100 bg-[#fcfffd] p-5">
                  {orders.length === 0 ? (
                    <p className="text-sm text-zinc-600">{t.noOrders}</p>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-sm font-semibold text-zinc-900">{t.ordersTitle}</h2>
                      {orders.map((order) => (
                        <article key={order.id} className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4">
                          <div className="grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                            <p>
                              <span className="font-semibold">{t.orderNo}:</span> {order.id}
                            </p>
                            <p>
                              <span className="font-semibold">{t.orderDate}:</span>{" "}
                              {new Date(order.createdAt).toLocaleString(language === "tr" ? "tr-TR" : "en-US")}
                            </p>
                            <p>
                              <span className="font-semibold">{t.orderPayment}:</span>{" "}
                              {paymentLabelMap[order.paymentMethod]}
                            </p>
                            <p>
                              <span className="font-semibold">{t.orderStatus}:</span>{" "}
                              {orderStatusLabelMap[order.status]}
                            </p>
                            <p>
                              <span className="font-semibold">{t.orderPhone}:</span> {order.phone}
                            </p>
                            <p className="md:col-span-2">
                              <span className="font-semibold">{t.orderAddress}:</span> {order.address}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-zinc-900">{t.orderItems}</p>
                            {order.items.map((item) => (
                              <div
                                key={`${order.id}-${item.productId}`}
                                className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm"
                              >
                                <span className="text-zinc-700">
                                  {item.name[language]} x {item.quantity}
                                </span>
                                <span className="font-semibold text-zinc-900">
                                  {formatter.format(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-sm">
                            <span className="font-medium text-zinc-600">{t.orderTotal}</span>
                            <span className="font-bold text-zinc-900">{formatter.format(order.subtotal)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {activeTab === "cart" ? (
                <section className="space-y-4 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-5">
                  {cartEntries.length === 0 ? (
                    <p className="text-sm text-zinc-600">{t.emptyCart}</p>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cartEntries.map((entry) => (
                          <article
                            key={entry.product.id}
                            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-white p-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-zinc-900">{entry.product.name[language]}</p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {formatter.format(entry.product.price)} x {entry.item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-zinc-800">
                              {formatter.format(entry.product.price * entry.item.quantity)}
                            </p>
                          </article>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-emerald-100 pt-4">
                        <span className="text-sm font-medium text-zinc-600">{t.subtotal}</span>
                        <span className="text-base font-bold text-zinc-900">{formatter.format(subtotal)}</span>
                      </div>
                      {!isOrderFormOpen ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderAddress(profileDetails.address);
                            setOrderPhone(profileDetails.phone);
                            setPaymentMethod("card");
                            setOrderError("");
                            setIsOrderFormOpen(true);
                          }}
                          className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                        >
                          {t.placeOrder}
                        </button>
                      ) : (
                        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4">
                          <h3 className="text-sm font-semibold text-zinc-900">{t.orderFormTitle}</h3>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              {t.address}
                            </label>
                            <textarea
                              value={orderAddress}
                              onChange={(event) => setOrderAddress(event.target.value)}
                              rows={3}
                              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
                              placeholder={t.addressPlaceholder}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              {t.phone}
                            </label>
                            <input
                              type="tel"
                              value={orderPhone}
                              onChange={(event) => setOrderPhone(event.target.value)}
                              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
                              placeholder={t.phonePlaceholder}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                              {t.paymentMethod}
                            </label>
                            <select
                              value={paymentMethod}
                              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-emerald-400"
                            >
                              <option value="card">{t.paymentCard}</option>
                              <option value="transfer">{t.paymentTransfer}</option>
                              <option value="cash">{t.paymentCash}</option>
                            </select>
                          </div>
                          {orderError ? <p className="text-sm font-medium text-rose-600">{orderError}</p> : null}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void submitOrder()}
                              disabled={isSubmittingOrder}
                              className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                            >
                              {t.placeOrder}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsOrderFormOpen(false);
                                setOrderError("");
                              }}
                              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <SiteFooter
        language={language}
        homeHref={`/?lang=${language}`}
        categoriesHref={`/?lang=${language}#categories`}
        dealsHref={`/?lang=${language}#deals`}
      />
    </div>
  );
}
