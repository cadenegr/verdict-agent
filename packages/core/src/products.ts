// Reading a list of products to judge: a test set (JSON) or one URL per line.
import { TestSetSchema, type Product } from "@app/shared";

export type ProductListResult = { ok: true; products: Product[] } | { ok: false; error: string };

/** One URL per line; blank lines and `#` comments are skipped, a missing scheme becomes https. */
export function readUrls(text: string): string[] {
  const urls: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    urls.push(/^https?:\/\//i.test(line) ? line : `https://${line}`);
  }
  return urls;
}

/** Same product, whatever the case of the host or a trailing slash. */
export function productKey(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}${u.search}`;
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

function fromUrlLines(text: string): ProductListResult {
  const products: Product[] = [];
  for (const url of readUrls(text)) {
    try {
      products.push({ name: new URL(url).hostname, url });
    } catch {
      return { ok: false, error: `not a URL: ${url}` };
    }
  }
  if (products.length === 0) return { ok: false, error: "no products in the list" };
  return { ok: true, products };
}

/** A test set keeps its names; a plain list is named by host. Labels are ignored here. */
export function parseProductList(text: string): ProductListResult {
  if (!text.trimStart().startsWith("{")) return fromUrlLines(text);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "the file starts with { but is not valid JSON" };
  }
  const parsed = TestSetSchema.safeParse(json);
  if (!parsed.success) return { ok: false, error: `not a test set: ${parsed.error.message}` };
  if (parsed.data.products.length === 0) return { ok: false, error: "no products in the list" };
  return { ok: true, products: parsed.data.products.map(({ name, url }) => ({ name, url })) };
}

/** The name a person gave the product, or undefined when the list only named it by host. */
export function givenName(product: Product): string | undefined {
  try {
    return product.name === new URL(product.url).hostname ? undefined : product.name;
  } catch {
    return product.name;
  }
}
