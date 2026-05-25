"use client";

import { addProductToCart } from "@/lib/cart-client";
import { getAuthUserSnapshot } from "@/lib/auth-client";
import type { Language } from "@/lib/i18n";

type AddToCartButtonProps = {
  language: Language;
  productId: number;
  label: string;
  className?: string;
};

export function AddToCartButton({ language, productId, label, className }: AddToCartButtonProps) {
  const onAddToCart = () => {
    const user = getAuthUserSnapshot();

    if (!user?.email) {
      window.alert(language === "tr" ? "Lutfen once giris yapmalisiniz." : "Please sign in first.");
      return;
    }

    addProductToCart(user.email, productId, 1);
  };

  return (
    <button type="button" onClick={onAddToCart} className={className}>
      {label}
    </button>
  );
}
