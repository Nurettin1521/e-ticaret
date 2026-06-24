# PatiShop (Next.js)

Petshop odakli e-ticaret arayuzu.
Bu dokuman projeye sonradan bakan biri icin "ne nerede, ne ise yarar" bilgisini guncel tutar.

## Mevcut Durum

- Header var: logo, menu, login/logout, sepet ikonu, dil secici (`TR/EN`).
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
- Admin panel var: `/admin` (sadece admin session)
- Admin panelde urun yonetimi var: urun ekleme, duzenleme, silme, listeleme.
- Admin panelde siparis yonetimi var: yeni/kargoya verilen/teslim edilen sekmeleri.
- Login DB tabanli calisiyor (API uzerinden dogrulama).
- Urunler DB'den cekiliyor (mock yerine veritabani).
- Sepet DB tabanli calisiyor (kullanici bazli `CartItem`).
- Siparis DB tabanli calisiyor (`Order`, `OrderItem`).
- Siparis olusturulunca urun stoklari DB tarafinda azaltiliyor.

## Teknoloji

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4
- Prisma ORM (v7)
- Supabase Postgres

## Klasor Yapisi

```text
app/
  admin/
    page.tsx                    # Admin dashboard (session + admin kontrolu)
  api/
    admin/orders/route.ts       # Admin siparis listeleme + durum guncelleme API'si
    admin/products/route.ts     # Admin urun CRUD API (listele/ekle/duzenle/sil)
    auth/me/route.ts            # Aktif session kullanicisini dondurur
    cart/route.ts               # Sepet listeleme/guncelleme/silme API (DB)
    login/route.ts              # Login dogrulama API (DB)
    logout/route.ts             # Session logout API (cookie temizleme)
    orders/route.ts             # Siparis stok kontrolu + stok azaltma API'si
    profile/route.ts            # Profil adres/telefon okuma-guncelleme API'si (DB)
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
  admin-orders-manager.tsx      # Admin siparis sekmeleri + durum guncelleme
  admin-products-manager.tsx    # Admin urun yonetim arayuzu (CRUD)
  admin-logout-button.tsx       # Admin paneli cikis butonu
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
  session.server.ts             # Session olusturma/dogrulama (HttpOnly cookie)
  product-types.ts              # Product/LocalizedText tipleri
  auth-client.ts                # Client auth snapshot + session hydrate/logout
  cart-client.ts                # Client cart snapshot + cart API entegrasyonu
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
- `isAdmin`
- `address`
- `phone`
- `createdAt`
- `updatedAt`

### Session

- `id` (PK)
- `userId` (FK -> `User`)
- `tokenHash` (unique)
- `expiresAt`
- `createdAt`
- `updatedAt`

### Product

- `id` (PK)
- `sku` (unique)
- `slug` (unique)
- `category`, `petType`
- `name` (JSON: `{ tr, en }`)
- `shortDescription` (JSON: `{ tr, en }`)
- `price`, `currency`, `stock`
- `rating`, `reviewCount`
- `badge` (JSON: `{ tr, en }`)
- `image`, `isPopular`, `isDeal`
- `createdAt`, `updatedAt`

### CartItem

- `id` (PK)
- `userId` (FK -> `User`)
- `productId` (FK -> `Product`)
- `quantity`
- `createdAt`
- `updatedAt`
- `@@unique([userId, productId])`

### Order

- `id` (PK)
- `userId` (FK -> `User`)
- `address`, `phone`, `paymentMethod`
- `status` (`new` | `shipped` | `delivered`)
- `subtotal`
- `createdAt`
- `updatedAt`

### OrderItem

- `id` (PK)
- `orderId` (FK -> `Order`)
- `productId` (FK -> `Product`)
- `productName` (JSON `{tr,en}` snapshot)
- `quantity`, `price`
- `createdAt`
- `updatedAt`

## Veri Akisi

### Login

1. Kullanici `/login` sayfasinda email/sifre girer.
2. `POST /api/login` cagrilir.
3. API, `lib/users.server.ts` ile `User` tablosundan dogrular.
4. Basariliysa `HttpOnly` session cookie set edilir.
5. UI state, `GET /api/auth/me` ile session'dan senkronize edilir.
6. `loginType=admin` ile gelen girislerde kullanicinin `isAdmin=true` olmasi zorunludur.

### Admin

- Login ekraninda `Musteri Girisi` / `Admin Girisi` secenegi vardir.
- Admin secenegi ile giriste basarili login sonrasi `/admin` sayfasina yonlendirilir.
- `/admin` sayfasi session kontrolu yapar; admin olmayanlar login ekranina geri yonlendirilir.
- Header'da giris yapan kullanici icin `Cikis Yap` butonu gorunur ve `POST /api/logout` ile session sonlandirilir.
- Admin siparis tabinda siparisler 3 sekmede gorulur:
  - `Beklemedeki Siparisler` (`status = new`)
  - `Kargoya Verilenler` (`status = shipped`)
  - `Teslim Edilenler` (`status = delivered`)
- Durum gecisleri:
  - `new -> shipped`
  - `shipped -> delivered`
- Admin panelde urun listesi uzerinden:
  - urun ekleme (`POST /api/admin/products`)
  - urun duzenleme (`PATCH /api/admin/products`)
  - urun silme (`DELETE /api/admin/products`)
  - urun listeleme (`GET /api/admin/products`)

### Profil

- `GET /api/profile` -> session kullanicisinin `address` ve `phone` bilgilerini getirir.
- `PATCH /api/profile` -> session kullanicisinin `address` ve `phone` bilgilerini DB'de gunceller.

### Urunler

- `GET /api/products` -> tum urunler
- `GET /api/products?popular=1` -> populer urunler
- API, veriyi `lib/products.server.ts` uzerinden `Product` tablosundan alir.

### Sepet

- `GET /api/cart` -> session kullanicisinin sepet urunleri
- `POST /api/cart` -> urunu sepete ekler
- `DELETE /api/cart` -> urunu sepetten siler veya tum sepeti temizler
- Sepete eklerken ust limit `Product.stock` kadar: stok 5 ise sepette toplam miktar 6 olamaz.

### Siparis ve Stok

1. Profil > Sepetim ekraninda `Siparis Ver` ile form submit edilir.
2. `POST /api/orders` cagrilir.
3. API, her urun icin transaction icinde stok kontrolu yapar (`stock >= quantity`).
4. Stok yeterliyse ilgili urunlerin `stock` degeri DB'de azaltilir.
5. Stok yetersizse siparis reddedilir ve hicbir urunde stok dusurulmez (rollback).
6. Basarili sipariste sepet DB tarafinda temizlenir ve siparis `Order/OrderItem` tablolarina yazilir.

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
- Profil butonu aktif; giris yapan kullanici profil sayfasina gecer.
- Sepet, siparis ve profil bilgileri (adres/telefon) su an DB tabanli.
- Cart / Order / Profile API'leri artik client'tan email almaz; kullanici session cookie uzerinden belirlenir.
- Sifreler su an `passwordHash` alaninda duz metin tutuluyor. Sonraki adimda `bcrypt`e gecilmesi onerilir.
