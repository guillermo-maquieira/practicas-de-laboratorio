import { describe, it, expect } from "vitest";
import { computeScore, DATES, ALL_DATES, filterByDate } from "./pdl";
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

describe("dates", () => {
  it("every date carries the year /26", () => {
    expect(DATES).toEqual(["26/11/26", "17/12/26"]);
    DATES.forEach((d) => expect(d.endsWith("/26")).toBe(true));
  });

  it("filter by date keeps only that date", () => {
    const rows = [{ date: "26/11/26" }, { date: "17/12/26" }, { date: "26/11/26" }];
    expect(filterByDate(rows, "17/12/26")).toEqual([{ date: "17/12/26" }]);
    expect(filterByDate(rows, "26/11/26")).toHaveLength(2);
  });

  it('"Todas" keeps every row', () => {
    const rows = [{ date: "26/11/26" }, { date: "17/12/26" }];
    expect(filterByDate(rows, ALL_DATES)).toHaveLength(2);
  });
});
