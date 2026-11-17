import { describe, it, expect } from "vitest";
import { computeScore } from "./pdl";
describe("computeScore", () => {
  it("full repo is 100", () => {
    const t = ["README.md", "docs/a.md", "img.png", "LICENSE"].map((path) => ({ path, type: "blob" }));
    expect(computeScore({ size: 500, description: "x" }, t).percent).toBe(100);
  });
  it("empty repo with 250KB gets 20", () => {
    expect(computeScore({ size: 250, description: null }, []).percent).toBe(20);
  });
  it("PDF counts as docs (15)", () => {
    expect(computeScore({ size: 0, description: null }, [{ path: "x.pdf", type: "blob" }]).percent).toBe(15);
  });
});
