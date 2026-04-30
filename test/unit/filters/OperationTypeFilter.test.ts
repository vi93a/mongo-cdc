import { describe, it, expect } from "vitest";
import { OperationTypeFilter } from "../../../src/filters/OperationTypeFilter.js";
import type { ChangeStreamDocument } from "mongodb";

describe("OperationTypeFilter", () => {
  it("should use defaults when no options given", () => {
    const filter = new OperationTypeFilter();
    expect(filter.shouldProcess({ operationType: "insert" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "update" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "delete" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "replace" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "drop" } as ChangeStreamDocument)).toBe(false);
  });

  it("should only accept specified operations", () => {
    const filter = new OperationTypeFilter({ operations: ["insert"] });
    expect(filter.shouldProcess({ operationType: "insert" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "update" } as ChangeStreamDocument)).toBe(false);
    expect(filter.shouldProcess({ operationType: "delete" } as ChangeStreamDocument)).toBe(false);
  });

  it("should accept multiple specified operations", () => {
    const filter = new OperationTypeFilter({ operations: ["insert", "delete"] });
    expect(filter.shouldProcess({ operationType: "insert" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "delete" } as ChangeStreamDocument)).toBe(true);
    expect(filter.shouldProcess({ operationType: "update" } as ChangeStreamDocument)).toBe(false);
  });
});
