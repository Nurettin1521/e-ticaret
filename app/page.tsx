"use client";

import { useEffect, useState } from "react";
import { PetshopHeader } from "@/components/petshop-header";
import { PopularProductsCarousel } from "@/components/popular-products-carousel";
import { ProductCatalog } from "@/components/product-catalog";
import { SiteFooter } from "@/components/site-footer";
import type { Language } from "@/lib/i18n";

export default function Home() {
  const [language, setLanguage] = useState<Language>("tr");
  const loginHref = `/login?lang=${language}&returnTo=${encodeURIComponent(`/?lang=${language}`)}`;

  useEffect(() => {
    document.documentElement.lang = language === "tr" ? "tr" : "en";
  }, [language]);

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <PetshopHeader language={language} onLanguageChange={setLanguage} loginHref={loginHref} />
      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 md:px-6">
        <PopularProductsCarousel language={language} />
        <ProductCatalog language={language} />
      </main>
      <SiteFooter language={language} />
    </div>
  );
}
