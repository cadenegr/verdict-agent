import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { givenName, parseProductList, productKey, readUrls } from "./products.ts";

const testSet = readFileSync(
  new URL("../../../fixtures/test-products.json", import.meta.url),
  "utf8",
);

describe("readUrls", () => {
  it("skips blanks and comments and adds https", () => {
    expect(readUrls("linear.app\n\n# note\nhttps://keybase.io\n")).toEqual([
      "https://linear.app",
      "https://keybase.io",
    ]);
  });
});

describe("productKey", () => {
  it("ignores host case and a trailing slash", () => {
    expect(productKey("https://Linear.app/")).toBe(productKey("https://linear.app"));
  });

  it("keeps different paths apart", () => {
    expect(productKey("https://example.com/a")).not.toBe(productKey("https://example.com/b"));
  });
});

describe("parseProductList", () => {
  it("reads the test set with its names", () => {
    const result = parseProductList(testSet);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.products).toHaveLength(7);
    expect(result.products[0]).toEqual({ name: "Linear", url: "https://linear.app" });
  });

  it("names a plain URL list by host", () => {
    expect(parseProductList("linear.app\nhttps://keybase.io/\n")).toEqual({
      ok: true,
      products: [
        { name: "linear.app", url: "https://linear.app" },
        { name: "keybase.io", url: "https://keybase.io/" },
      ],
    });
  });

  it("refuses an empty list", () => {
    expect(parseProductList("# nothing\n")).toEqual({
      ok: false,
      error: "no products in the list",
    });
  });

  it("refuses broken JSON and JSON that is not a test set", () => {
    expect(parseProductList("{ nope").ok).toBe(false);
    expect(parseProductList('{"products":[{"name":"x"}]}').ok).toBe(false);
  });

  it("refuses a line that is not a URL", () => {
    expect(parseProductList("http://\n").ok).toBe(false);
  });
});

describe("givenName", () => {
  it("keeps a name a person gave, and drops a name that is only the host", () => {
    expect(givenName({ name: "AnyDesk", url: "https://anydesk.com/en" })).toBe("AnyDesk");
    expect(givenName({ name: "anydesk.com", url: "https://anydesk.com/en" })).toBeUndefined();
  });
});
