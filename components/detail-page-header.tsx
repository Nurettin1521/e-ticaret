"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Language } from "@/lib/i18n";
import { PetshopHeader } from "@/components/petshop-header";

type DetailPageHeaderProps = {
  language: Language;
};

export function DetailPageHeader({ language }: DetailPageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.lang = language === "tr" ? "tr" : "en";
  }, [language]);

  const handleLanguageChange = (nextLanguage: Language) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLanguage);
    router.push(`${pathname}?${params.toString()}`);
  };

  const homeHref = `/?lang=${language}`;
  const categoriesHref = `/?lang=${language}#categories`;
  const dealsHref = `/?lang=${language}#deals`;
  const query = searchParams.toString();
  const returnTo = query ? `${pathname}?${query}` : pathname;
  const loginHref = `/login?lang=${language}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <PetshopHeader
      language={language}
      onLanguageChange={handleLanguageChange}
      homeHref={homeHref}
      categoriesHref={categoriesHref}
      dealsHref={dealsHref}
      loginHref={loginHref}
    />
  );
}
