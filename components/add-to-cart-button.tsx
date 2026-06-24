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
  const onAddToCart = async () => {
    const user = getAuthUserSnapshot();

    if (!user?.email) {
      window.alert(language === "tr" ? "Lutfen once giris yapmalisiniz." : "Please sign in first.");
      return;
    }

    const result = await addProductToCart(user.email, productId, 1);
    if (!result.ok) {
      if (result.error === "UNAUTHORIZED") {
        window.alert(language === "tr" ? "Lutfen yeniden giris yapin." : "Please sign in again.");
        return;
      }

      if (result.error === "INSUFFICIENT_STOCK") {
        window.alert(
          language === "tr"
            ? "Bu urunden stokta kaldigindan fazla ekleyemezsin."
            : "You cannot add more than the available stock for this product.",
        );
        return;
      }

      window.alert(language === "tr" ? "Sepet guncellenemedi." : "Cart could not be updated.");
    }
  };

  return (
    <button type="button" onClick={() => void onAddToCart()} className={className}>
      {label}
    </button>
  );
}
