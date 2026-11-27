import { describe, expect, it } from "vitest";
import { csvRecords, parseCsv } from "./csv.ts";

describe("parseCsv", () => {
  it("reads quoted cells with commas, doubled quotes and newlines", () => {
    const text = 'a,b\r\n"x, y","say ""hi""\nthere"\n\n';
    expect(parseCsv(text)).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
  });

  it("drops a byte-order mark", () => {
    expect(parseCsv("\uFEFFid\n1")).toEqual([["id"], ["1"]]);
  });
});

describe("csvRecords", () => {
  it("keys each row by the header, lower-cased and trimmed", () => {
    expect(csvRecords("ID, URL\n1 , https://a.example\n2")).toEqual([
      { id: "1", url: "https://a.example" },
      { id: "2", url: "" },
    ]);
  });
});
