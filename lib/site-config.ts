const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelProductionUrl ? `https://${vercelProductionUrl}` : "http://localhost:3000");

export const siteConfig = {
  name: "PatiShop",
  shortName: "PatiShop",
  description:
    "PatiShop petshop urunleri: kedi, kopek, kus ve kemirgenler icin mama, oyuncak, aksesuar ve bakim urunleri.",
  locale: "tr_TR",
};
