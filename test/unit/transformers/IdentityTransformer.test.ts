import { describe, it, expect } from "vitest";
import { IdentityTransformer } from "../../../src/transformers/IdentityTransformer.js";
import type { ChangeStreamDocument } from "mongodb";

describe("IdentityTransformer", () => {
  const transformer = new IdentityTransformer();

  it("should return the event unchanged", () => {
    const event = {
      operationType: "insert",
      fullDocument: { name: "test" },
    } as unknown as ChangeStreamDocument;

    const result = transformer.transform(event);
    expect(result).toBe(event);
  });
});
