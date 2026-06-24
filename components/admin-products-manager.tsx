"use client";

import { useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n";
import type { Product } from "@/lib/product-types";

type AdminProductsManagerProps = {
  language: Language;
};

type ProductForm = {
  sku: string;
  slug: string;
  category: string;
  petType: string;
  nameTr: string;
  nameEn: string;
  shortDescriptionTr: string;
  shortDescriptionEn: string;
  price: string;
  currency: string;
  stock: string;
  rating: string;
  reviewCount: string;
  badgeTr: string;
  badgeEn: string;
  image: string;
  isPopular: boolean;
  isDeal: boolean;
};

const categoryOptions = ["accessory", "bed", "food", "grooming", "habitat", "hygiene", "toy"];
const petTypeOptions = ["bird", "cat", "dog", "rodent"];

const content = {
  tr: {
    title: "Urun Yonetimi",
    subtitle: "Yeni urun ekle, mevcut urunleri duzenle veya sil.",
    loading: "Urunler yukleniyor...",
    saveNew: "Urun Ekle",
    saveEdit: "Degisiklikleri Kaydet",
    reset: "Temizle",
    createMode: "Yeni Urun Modu",
    editMode: "Duzenleme Modu",
    listTitle: "Urun Listesi",
    noProducts: "Urun bulunamadi.",
    edit: "Duzenle",
    remove: "Sil",
    formError: "Lutfen zorunlu alanlari doldur.",
    saveError: "Islem basarisiz oldu. Tekrar dene.",
    saveSuccess: "Urun kaydedildi.",
    deleteSuccess: "Urun silindi.",
    deleteInUse: "Bu urun siparis/sepet iliskisi nedeniyle silinemiyor.",
    confirmDelete: "Bu urunu silmek istiyor musun?",
    sku: "SKU",
    slug: "Slug",
    category: "Kategori",
    petType: "Pet Type",
    nameTr: "Urun Adi (TR)",
    nameEn: "Urun Adi (EN)",
    shortDescriptionTr: "Kisa Aciklama (TR)",
    shortDescriptionEn: "Kisa Aciklama (EN)",
    price: "Fiyat",
    currency: "Para Birimi",
    stock: "Stok",
    rating: "Puan (0-5)",
    reviewCount: "Yorum Sayisi",
    badgeTr: "Etiket (TR)",
    badgeEn: "Etiket (EN)",
    image: "Gorsel Yolu",
    isPopular: "Populer",
    isDeal: "Firsat",
    actions: "Islemler",
  },
  en: {
    title: "Product Management",
    subtitle: "Add new products, edit existing products, or remove them.",
    loading: "Loading products...",
    saveNew: "Add Product",
    saveEdit: "Save Changes",
    reset: "Reset",
    createMode: "Create Mode",
    editMode: "Edit Mode",
    listTitle: "Product List",
    noProducts: "No products found.",
    edit: "Edit",
    remove: "Delete",
    formError: "Please fill required fields.",
    saveError: "Operation failed. Please try again.",
    saveSuccess: "Product saved.",
    deleteSuccess: "Product deleted.",
    deleteInUse: "This product cannot be deleted because it is used in orders/carts.",
    confirmDelete: "Do you want to delete this product?",
    sku: "SKU",
    slug: "Slug",
    category: "Category",
    petType: "Pet Type",
    nameTr: "Name (TR)",
    nameEn: "Name (EN)",
    shortDescriptionTr: "Short Description (TR)",
    shortDescriptionEn: "Short Description (EN)",
    price: "Price",
    currency: "Currency",
    stock: "Stock",
    rating: "Rating (0-5)",
    reviewCount: "Review Count",
    badgeTr: "Badge (TR)",
    badgeEn: "Badge (EN)",
    image: "Image Path",
    isPopular: "Popular",
    isDeal: "Deal",
    actions: "Actions",
  },
} as const;

const emptyForm: ProductForm = {
  sku: "",
  slug: "",
  category: "food",
  petType: "cat",
  nameTr: "",
  nameEn: "",
  shortDescriptionTr: "",
  shortDescriptionEn: "",
  price: "",
  currency: "TRY",
  stock: "0",
  rating: "0",
  reviewCount: "0",
  badgeTr: "",
  badgeEn: "",
  image: "/globe.svg",
  isPopular: false,
  isDeal: false,
};

function productToForm(product: Product): ProductForm {
  return {
    sku: product.sku,
    slug: product.slug,
    category: product.category,
    petType: product.petType,
    nameTr: product.name.tr,
    nameEn: product.name.en,
    shortDescriptionTr: product.shortDescription.tr,
    shortDescriptionEn: product.shortDescription.en,
    price: String(product.price),
    currency: product.currency,
    stock: String(product.stock),
    rating: String(product.rating),
    reviewCount: String(product.reviewCount),
    badgeTr: product.badge.tr,
    badgeEn: product.badge.en,
    image: product.image,
    isPopular: product.isPopular,
    isDeal: product.isDeal,
  };
}

export function AdminProductsManager({ language }: AdminProductsManagerProps) {
  const t = content[language];
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.id - b.id),
    [products],
  );

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as
          | { ok?: boolean; products?: Product[] }
          | null;

        if (cancelled || !response.ok || !data?.ok || !Array.isArray(data.products)) return;
        setProducts(data.products);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const onSubmit = async () => {
    if (!form.sku || !form.slug || !form.nameTr || !form.nameEn || !form.category || !form.petType || !form.price) {
      setError(t.formError);
      setMessage("");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    const payload = {
      id: editingId ?? undefined,
      sku: form.sku,
      slug: form.slug,
      category: form.category,
      petType: form.petType,
      name: { tr: form.nameTr, en: form.nameEn },
      shortDescription: { tr: form.shortDescriptionTr, en: form.shortDescriptionEn },
      price: Number(form.price),
      currency: form.currency,
      stock: Number(form.stock),
      rating: Number(form.rating),
      reviewCount: Number(form.reviewCount),
      badge: { tr: form.badgeTr, en: form.badgeEn },
      image: form.image,
      isPopular: form.isPopular,
      isDeal: form.isDeal,
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; product?: Product; error?: string }
        | null;

      if (!response.ok || !data?.ok || !data.product) {
        setError(t.saveError);
        return;
      }

      setProducts((prev) => {
        const exists = prev.some((item) => item.id === data.product!.id);
        if (exists) {
          return prev.map((item) => (item.id === data.product!.id ? data.product! : item));
        }
        return [...prev, data.product!];
      });
      setMessage(t.saveSuccess);
      setError("");
      setEditingId(data.product.id);
      setForm(productToForm(data.product));
    } catch {
      setError(t.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (product: Product) => {
    const confirmed = window.confirm(t.confirmDelete);
    if (!confirmed) return;

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !data?.ok) {
        if (data?.error === "PRODUCT_IN_USE") {
          setError(t.deleteInUse);
        } else {
          setError(t.saveError);
        }
        return;
      }

      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      if (editingId === product.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      setMessage(t.deleteSuccess);
    } catch {
      setError(t.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-emerald-100 bg-[#fcfffd] p-4 md:p-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{t.title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {editingId ? t.editMode : t.createMode}
          </p>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
          >
            {t.reset}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} placeholder={t.sku} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder={t.slug} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900">
            {categoryOptions.map((item) => <option key={item} value={item}>{t.category}: {item}</option>)}
          </select>
          <select value={form.petType} onChange={(e) => setForm((p) => ({ ...p, petType: e.target.value }))} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900">
            {petTypeOptions.map((item) => <option key={item} value={item}>{t.petType}: {item}</option>)}
          </select>
          <input value={form.nameTr} onChange={(e) => setForm((p) => ({ ...p, nameTr: e.target.value }))} placeholder={t.nameTr} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder={t.nameEn} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.shortDescriptionTr} onChange={(e) => setForm((p) => ({ ...p, shortDescriptionTr: e.target.value }))} placeholder={t.shortDescriptionTr} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.shortDescriptionEn} onChange={(e) => setForm((p) => ({ ...p, shortDescriptionEn: e.target.value }))} placeholder={t.shortDescriptionEn} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder={t.price} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} placeholder={t.currency} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} placeholder={t.stock} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} placeholder={t.rating} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.reviewCount} onChange={(e) => setForm((p) => ({ ...p, reviewCount: e.target.value }))} placeholder={t.reviewCount} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.badgeTr} onChange={(e) => setForm((p) => ({ ...p, badgeTr: e.target.value }))} placeholder={t.badgeTr} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.badgeEn} onChange={(e) => setForm((p) => ({ ...p, badgeEn: e.target.value }))} placeholder={t.badgeEn} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900" />
          <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder={t.image} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 sm:col-span-2" />
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm((p) => ({ ...p, isPopular: e.target.checked }))} />
            {t.isPopular}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.isDeal} onChange={(e) => setForm((p) => ({ ...p, isDeal: e.target.checked }))} />
            {t.isDeal}
          </label>
        </div>

        {message ? <p className="mt-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSubmitting}
          className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {editingId ? t.saveEdit : t.saveNew}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-100 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">{t.listTitle}</h3>
        {isLoading ? (
          <p className="mt-3 text-sm text-zinc-600">{t.loading}</p>
        ) : sortedProducts.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">{t.noProducts}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">{t.sku}</th>
                  <th className="py-2 pr-3">{t.nameTr}</th>
                  <th className="py-2 pr-3">{t.price}</th>
                  <th className="py-2 pr-3">{t.stock}</th>
                  <th className="py-2 pr-3">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-zinc-100 text-zinc-800">
                    <td className="py-2 pr-3">{product.id}</td>
                    <td className="py-2 pr-3">{product.sku}</td>
                    <td className="py-2 pr-3">{product.name[language]}</td>
                    <td className="py-2 pr-3">{product.price}</td>
                    <td className="py-2 pr-3">{product.stock}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(product.id);
                            setForm(productToForm(product));
                            setError("");
                            setMessage("");
                          }}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-300 hover:text-emerald-700"
                        >
                          {t.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(product)}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-rose-300 hover:text-rose-700"
                        >
                          {t.remove}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
