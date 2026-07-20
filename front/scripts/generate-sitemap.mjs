import { writeFileSync } from "node:fs";

const SITE_URL = "https://aurassens.shop";
const API_URL = `${SITE_URL}/api/products`;

const STATIC_PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/notre-histoire", priority: "0.6" },
  { path: "/politique-confidentialite", priority: "0.3" },
];

async function main() {
  let products = [];
  try {
    const res = await fetch(API_URL);
    products = res.ok ? await res.json() : [];
  } catch (err) {
    console.warn(`Could not fetch ${API_URL} (${err.message}) — falling back to static paths only.`);
  }

  const urls = [
    ...STATIC_PATHS.map((p) => ({ loc: `${SITE_URL}${p.path}`, priority: p.priority })),
    ...products.map((p) => ({ loc: `${SITE_URL}/produit/${p.id}`, priority: "0.8" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;

  writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml);
  console.log(`sitemap.xml written with ${urls.length} URLs`);
}

main();
