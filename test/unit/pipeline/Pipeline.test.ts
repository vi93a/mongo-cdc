import { describe, it, expect, vi, beforeEach } from "vitest";
import { Pipeline } from "../../../src/pipeline/Pipeline.js";
import type { IChangeEventFilter } from "../../../src/interfaces/index.js";
import type { IChangeEventTransformer } from "../../../src/interfaces/index.js";
import type { ISink } from "../../../src/interfaces/index.js";
import type { ChangeStreamDocument } from "mongodb";

vi.mock("../../../src/util/logger.js", () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

function createMockSource(events: ChangeStreamDocument[], pipeline: { stop: () => Promise<void> }) {
  let called = false;
  return {
    connect: vi.fn(),
    watch: vi.fn(() => ({
      async *[Symbol.asyncIterator]() {
        if (called) {
          // Second call means reconnect loop — stop the pipeline
          await pipeline.stop();
          return;
        }
        called = true;
        for (const event of events) {
          yield event;
        }
      },
    })),
    close: vi.fn(),
  };
}

function createMockFilter(accept: boolean): IChangeEventFilter {
  return { shouldProcess: vi.fn(() => accept) };
}

function createMockTransformer(): IChangeEventTransformer {
  return { transform: vi.fn((e) => e) };
}

function createMockSink(): ISink {
  return {
    connect: vi.fn(),
    publish: vi.fn(),
    disconnect: vi.fn(),
  };
}

function createMockResumeTokenStore() {
  return {
    load: vi.fn(() => Promise.resolve(undefined)),
    save: vi.fn(),
    close: vi.fn(),
  };
}

describe("Pipeline", () => {
  let events: ChangeStreamDocument[];

  beforeEach(() => {
    events = [
      {
        _id: { _data: "token1" },
        operationType: "insert",
        documentKey: { _id: "doc1" },
      } as unknown as ChangeStreamDocument,
      {
        _id: { _data: "token2" },
        operationType: "update",
        documentKey: { _id: "doc2" },
      } as unknown as ChangeStreamDocument,
    ];
  });

  it("should process events through filter, transformer, and sink", async () => {
    const filter = createMockFilter(true);
    const transformer = createMockTransformer();
    const sink = createMockSink();
    const tokenStore = createMockResumeTokenStore();

    // We need a reference to pipeline to stop it from mock source
    let pipeline!: Pipeline;
    const pipelineRef = { stop: () => pipeline.stop() };
    const source = createMockSource(events, pipelineRef);

    pipeline = new Pipeline(
      source as never,
      filter,
      transformer,
      sink,
      tokenStore as never
    );

    await pipeline.start();

    expect(source.connect).toHaveBeenCalled();
    expect(sink.connect).toHaveBeenCalled();
    expect(filter.shouldProcess).toHaveBeenCalledTimes(2);
    expect(transformer.transform).toHaveBeenCalledTimes(2);
    expect(sink.publish).toHaveBeenCalledTimes(2);
    expect(tokenStore.save).toHaveBeenCalledTimes(2);
  });

  it("should skip events that fail the filter", async () => {
    const filter = createMockFilter(false);
    const transformer = createMockTransformer();
    const sink = createMockSink();
    const tokenStore = createMockResumeTokenStore();

    let pipeline!: Pipeline;
    const pipelineRef = { stop: () => pipeline.stop() };
    const source = createMockSource(events, pipelineRef);

    pipeline = new Pipeline(
      source as never,
      filter,
      transformer,
      sink,
      tokenStore as never
    );

    await pipeline.start();

    expect(filter.shouldProcess).toHaveBeenCalledTimes(2);
    expect(transformer.transform).not.toHaveBeenCalled();
    expect(sink.publish).not.toHaveBeenCalled();
  });
});
