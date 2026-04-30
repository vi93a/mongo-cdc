import { MongoClient, type Collection, type ResumeToken } from "mongodb";
import type { IResumeTokenStore } from "../interfaces/IResumeTokenStore.js";
import { getLogger } from "../util/logger.js";

const DEFAULT_COLLECTION = "cdc_resume_tokens";
const DEFAULT_PIPELINE_ID = "default";

interface ResumeTokenDocument {
  _id: string;
  token: ResumeToken;
  updatedAt: Date;
}

export class MongoResumeTokenStore implements IResumeTokenStore {
  private client: MongoClient;
  private collection: Collection<ResumeTokenDocument>;
  private pipelineId: string;

  private readonly enabled: boolean;

  constructor(
    uri: string,
    database: string,
    collection: string = DEFAULT_COLLECTION,
    pipelineId: string = DEFAULT_PIPELINE_ID,
    enabled: boolean = true
  ) {
    this.client = new MongoClient(uri);
    this.collection = this.client.db(database).collection(collection);
    this.pipelineId = pipelineId;
    this.enabled = enabled;
  }

  async load(): Promise<ResumeToken | undefined> {
    if (!this.enabled) return undefined;
    const logger = getLogger();
    await this.client.connect();

    const doc = await this.collection.findOne({ _id: this.pipelineId });
    if (!doc) {
      logger.info("No resume token found in MongoDB, starting fresh");
      return undefined;
    }

    logger.info(
      { pipelineId: this.pipelineId },
      "Loaded resume token from MongoDB"
    );
    return doc.token;
  }

  async save(token: ResumeToken): Promise<void> {
    if (!this.enabled) return;
    await this.collection.updateOne(
      { _id: this.pipelineId },
      { $set: { token, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  async close(): Promise<void> {
    if (!this.enabled) return;
    await this.client.close();
    getLogger().info("Resume token MongoDB connection closed");
  }
}
