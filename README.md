# PatiShop (Next.js)

Petshop odakli e-ticaret arayuzu.
Bu dokuman projeye sonradan bakan biri icin "ne nerede, ne ise yarar" bilgisini guncel tutar.

## Mevcut Durum

- Header var: logo, menu, login, sepet ikonu, dil secici (`TR/EN`).
- Sepet ikonuna tiklayinca sagdan drawer (popup) acilir.
- Dil degisikligi ana sayfa ve urun iceriklerine yansir.
- Popular products carousel var:
  - Otomatik kaydirma: `5` saniye
  - Manuel gecis: `←` ve `→`
- Product catalog var:
  - Sol filtre alani + sag urun listesi
  - Filtreler: `category`, `petType`, `price range`
  - Mobilde filtre paneli ac/kapa
  - Sayfalama: sayfa basina `12` urun
- Urun detay sayfasi var: `/urun/[slug]`
- Login DB tabanli calisiyor (API uzerinden dogrulama).
- Urunler DB'den cekiliyor (mock yerine veritabani).

## Teknoloji

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- Prisma ORM (v7)
- Supabase Postgres

## Klasor Yapisi

```text
app/
  api/
    login/route.ts              # Login dogrulama API (DB)
    products/route.ts           # Urun listeleme API (DB)
  login/
    page.tsx
    login-client.tsx            # Login formu (API'ye POST)
  urun/[slug]/page.tsx          # Dinamik urun detay sayfasi (DB)
  layout.tsx                    # Global metadata + JSON-LD
  page.tsx                      # Ana sayfa
  robots.ts                     # robots.txt uretimi
  sitemap.ts                    # sitemap.xml uretimi
  opengraph-image.tsx           # OG image

components/
  petshop-header.tsx            # Header + login + sepet drawer + dil secici
  popular-products-carousel.tsx # Populer urunler (API'den)
  product-catalog.tsx           # Filtre + urun listesi (API'den)
  add-to-cart-button.tsx        # Sepete ekle (client-side)
  detail-page-header.tsx        # Urun detay header wrapper
  site-footer.tsx               # Footer

lib/
  db.ts                         # Prisma client (Supabase baglantisi)
  products.server.ts            # Product sorgulari (DB)
  users.server.ts               # User sorgulari (DB)
  product-types.ts              # Product/LocalizedText tipleri
  auth-client.ts                # Local auth state (localStorage)
  cart-client.ts                # Local cart state (localStorage)
  i18n.ts
  site-config.ts

prisma/
  schema.prisma                 # User + Product modelleri
  migrations/                   # Prisma migration dosyalari
  seed-products.sql             # products.json'dan uretilen SQL seed

scripts/
  generate-product-seed-sql.mjs # products.json -> seed-products.sql

data/
  products.json                 # Seed kaynagi
  users.json                    # Eski mock dosya (aktif login kaynagi degil)
```

## Veritabani Modelleri

### User

- `id` (PK)
- `name`
- `email` (unique)
- `passwordHash`
- `createdAt`
- `updatedAt`

### Product

- `id` (PK)
- `sku` (unique)
- `slug` (unique)
- `category`, `petType`
- `name` (JSON: `{ tr, en }`)
- `shortDescription` (JSON: `{ tr, en }`)
- `price`, `compareAtPrice`, `currency`, `stock`
- `rating`, `reviewCount`
- `badge` (JSON: `{ tr, en }`)
- `image`, `isPopular`, `isDeal`
- `createdAt`, `updatedAt`

## Veri Akisi

### Login

1. Kullanici `/login` sayfasinda email/sifre girer.
2. `POST /api/login` cagrilir.
3. API, `lib/users.server.ts` ile `User` tablosundan dogrular.
4. Basariliysa client tarafinda auth bilgisi localStorage'a yazilir.

### Urunler

- `GET /api/products` -> tum urunler
- `GET /api/products?popular=1` -> populer urunler
- API, veriyi `lib/products.server.ts` uzerinden `Product` tablosundan alir.

## Seed ve Migration

### Ilk kurulum

```bash
npm install
npx prisma migrate dev
npx prisma generate
```

### Product seed (products.json -> DB)

```bash
node scripts/generate-product-seed-sql.mjs
npx prisma db execute --file prisma/seed-products.sql
```

## Ortam Degiskenleri (.env)

```bash
# Supabase pooler (uygulama baglantisi)
DATABASE_URL="..."

# Supabase direct (migrate/cli)
DIRECT_URL="..."

# SEO canonical/sitemap host
NEXT_PUBLIC_SITE_URL="https://senin-domainin.com"
```

Not: Prisma v7'de datasource URL ayari `prisma.config.ts` tarafindan kullanilir.

## Gelistirme Komutlari

```bash
npm run dev
npm run lint
npm run build
```

## SEO Notlari

- `app/layout.tsx`: global metadata (`title`, `description`, `canonical`, OpenGraph, Twitter, robots)
- `app/layout.tsx`: Organization + WebSite JSON-LD
- `app/urun/[slug]/page.tsx`: urun bazli metadata + Product JSON-LD
- `app/robots.ts`: robots.txt
- `app/sitemap.ts`: sitemap.xml

## Onemli Notlar

- Responsive davranis her degisiklikte mobile/tablet/desktop icin kontrol edilmeli.
- Profil butonu halen pasif.
- Sepet su an localStorage tabanli (kullanici bazli key ile).
- Sifreler su an `passwordHash` alaninda duz metin tutuluyor. Sonraki adimda `bcrypt`e gecilmesi onerilir.
