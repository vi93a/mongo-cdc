import { describe, it, expect, vi } from "vitest";
import { ConsoleSink } from "../../../src/sinks/ConsoleSink.js";

vi.mock("../../../src/util/logger.js", () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("ConsoleSink", () => {
  const sink = new ConsoleSink();

  it("should connect without error", async () => {
    await expect(sink.connect()).resolves.toBeUndefined();
  });

  it("should publish without error", async () => {
    await expect(sink.publish({ test: true }, "key-1")).resolves.toBeUndefined();
  });

  it("should disconnect without error", async () => {
    await expect(sink.disconnect()).resolves.toBeUndefined();
  });
});
