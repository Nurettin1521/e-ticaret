import type { Language } from "@/lib/i18n";

const content = {
  tr: {
    description: "PatiShop, evcil hayvan dostlariniz icin guvenli alisveris deneyimi sunar.",
    quickLinks: "Hizli Baglantilar",
    customer: "Musteri Hizmetleri",
    contact: "Iletisim",
    faq: "Sikca Sorulan Sorular",
    returns: "Iade ve Degisim",
    privacy: "Gizlilik Politikasi",
    terms: "Kullanim Kosullari",
    rights: "Tum haklari saklidir.",
  },
  en: {
    description: "PatiShop provides a safe shopping experience for your pet friends.",
    quickLinks: "Quick Links",
    customer: "Customer Service",
    contact: "Contact",
    faq: "FAQ",
    returns: "Returns and Exchange",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
    rights: "All rights reserved.",
  },
};

type SiteFooterProps = {
  language: Language;
  homeHref?: string;
  categoriesHref?: string;
  dealsHref?: string;
};

export function SiteFooter({
  language,
  homeHref = "#",
  categoriesHref = "#categories",
  dealsHref = "#deals",
}: SiteFooterProps) {
  const t = content[language];
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-emerald-100 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">PatiShop</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">{t.description}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">{t.quickLinks}</h4>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <a href={homeHref} className="transition-colors hover:text-emerald-700">
                {language === "tr" ? "Ana Sayfa" : "Home"}
              </a>
            </li>
            <li>
              <a href={categoriesHref} className="transition-colors hover:text-emerald-700">
                {language === "tr" ? "Kategoriler" : "Categories"}
              </a>
            </li>
            <li>
              <a href={dealsHref} className="transition-colors hover:text-emerald-700">
                {language === "tr" ? "Firsat Urunleri" : "Deals"}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">{t.customer}</h4>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <a href="#" className="transition-colors hover:text-emerald-700">
                {t.contact}
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-emerald-700">
                {t.faq}
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-emerald-700">
                {t.returns}
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-emerald-700">
                {t.privacy}
              </a>
            </li>
            <li>
              <a href="#" className="transition-colors hover:text-emerald-700">
                {t.terms}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-emerald-100">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500 md:px-6">
          <p>
            © {year} PatiShop. {t.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
