import fs from "node:fs";
import path from "node:path";

const productsPath = path.join(process.cwd(), "data", "products.json");
const outputPath = path.join(process.cwd(), "prisma", "seed-products.sql");

/** @type {Array<Record<string, unknown>>} */
const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const escapeSql = (value) => String(value).replaceAll("'", "''");
const asJsonb = (value) => `'${escapeSql(JSON.stringify(value))}'::jsonb`;

const values = products
  .map((product) => {
    return `(${product.id},'${escapeSql(product.sku)}','${escapeSql(product.slug)}','${escapeSql(product.category)}','${escapeSql(product.petType)}',${asJsonb(product.name)},${asJsonb(product.shortDescription)},${product.price},${product.compareAtPrice},'${escapeSql(product.currency)}',${product.stock},${product.rating},${product.reviewCount},${asJsonb(product.badge)},'${escapeSql(product.image)}',${product.isPopular},${product.isDeal},NOW())`;
  })
  .join(",\n");

const sql = `INSERT INTO "Product" ("id","sku","slug","category","petType","name","shortDescription","price","compareAtPrice","currency","stock","rating","reviewCount","badge","image","isPopular","isDeal","updatedAt")
VALUES
${values}
ON CONFLICT ("id") DO UPDATE SET
"sku"=EXCLUDED."sku",
"slug"=EXCLUDED."slug",
"category"=EXCLUDED."category",
"petType"=EXCLUDED."petType",
"name"=EXCLUDED."name",
"shortDescription"=EXCLUDED."shortDescription",
"price"=EXCLUDED."price",
"compareAtPrice"=EXCLUDED."compareAtPrice",
"currency"=EXCLUDED."currency",
"stock"=EXCLUDED."stock",
"rating"=EXCLUDED."rating",
"reviewCount"=EXCLUDED."reviewCount",
"badge"=EXCLUDED."badge",
"image"=EXCLUDED."image",
"isPopular"=EXCLUDED."isPopular",
"isDeal"=EXCLUDED."isDeal",
"updatedAt"=NOW();
`;

fs.writeFileSync(outputPath, sql, "utf8");
console.log(`seed SQL generated: ${outputPath} (${products.length} products)`);
