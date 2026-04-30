import { describe, it, expect } from "vitest";
import { PassThroughFilter } from "../../../src/filters/PassThroughFilter.js";
import type { ChangeStreamDocument } from "mongodb";

describe("PassThroughFilter", () => {
  const filter = new PassThroughFilter();

  it("should accept all events", () => {
    const event = { operationType: "insert" } as ChangeStreamDocument;
    expect(filter.shouldProcess(event)).toBe(true);
  });

  it("should accept delete events", () => {
    const event = { operationType: "delete" } as ChangeStreamDocument;
    expect(filter.shouldProcess(event)).toBe(true);
  });
});
