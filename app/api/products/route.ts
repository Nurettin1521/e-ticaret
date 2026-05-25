import { NextResponse } from "next/server";
import { getAllProducts, getPopularProducts } from "@/lib/products.server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const popular = searchParams.get("popular");

  const products =
    popular === "1" ? await getPopularProducts(10) : await getAllProducts();

  return NextResponse.json({ products });
}
