-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "petType" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "shortDescription" JSONB NOT NULL,
    "price" INTEGER NOT NULL,
    "compareAtPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "badge" JSONB NOT NULL,
    "image" TEXT NOT NULL,
    "isPopular" BOOLEAN NOT NULL,
    "isDeal" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
