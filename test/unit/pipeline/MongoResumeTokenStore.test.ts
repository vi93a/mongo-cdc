import { describe, it, expect, vi, beforeEach } from "vitest";
import { MongoResumeTokenStore } from "../../../src/pipeline/MongoResumeTokenStore.js";

vi.mock("../../../src/util/logger.js", () => ({
  getLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

const mockFindOne = vi.fn();
const mockUpdateOne = vi.fn();
const mockCollection = vi.fn(() => ({
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
}));
const mockDb = vi.fn(() => ({ collection: mockCollection }));
const mockConnect = vi.fn();
const mockClose = vi.fn();

vi.mock("mongodb", () => ({
  MongoClient: vi.fn(() => ({
    connect: mockConnect,
    close: mockClose,
    db: mockDb,
  })),
}));

describe("MongoResumeTokenStore", () => {
  let store: MongoResumeTokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new MongoResumeTokenStore(
      "mongodb://localhost:27017",
      "test-db",
      "cdc_resume_tokens",
      "test-pipeline"
    );
  });

  it("should return undefined when no token exists", async () => {
    mockFindOne.mockResolvedValue(null);
    const result = await store.load();
    expect(result).toBeUndefined();
    expect(mockConnect).toHaveBeenCalled();
    expect(mockFindOne).toHaveBeenCalledWith({ _id: "test-pipeline" });
  });

  it("should return saved token", async () => {
    const token = { _data: "test-token-123" };
    mockFindOne.mockResolvedValue({ _id: "test-pipeline", token });
    const result = await store.load();
    expect(result).toEqual(token);
  });

  it("should save token with upsert", async () => {
    const token = { _data: "test-token-456" };
    await store.save(token);
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: "test-pipeline" },
      { $set: { token, updatedAt: expect.any(Date) } },
      { upsert: true }
    );
  });

  it("should close the MongoDB connection", async () => {
    await store.close();
    expect(mockClose).toHaveBeenCalled();
  });
});
