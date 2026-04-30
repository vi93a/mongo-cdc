import {
  MongoClient,
  type ChangeStream,
  type ChangeStreamDocument,
  type ResumeToken,
  type MongoClientOptions,
} from "mongodb";
import type { AppConfig } from "../config/schema.js";
import { getLogger } from "../util/logger.js";

export class MongoChangeStream {
  private client: MongoClient;
  private stream: ChangeStream | undefined;
  private database: string;
  private collection?: string;

  constructor(config: AppConfig["mongo"]) {
    const options: MongoClientOptions = {};
    if (config.username && config.password) {
      options.auth = { username: config.username, password: config.password };
    }
    if (config.authSource) {
      options.authSource = config.authSource;
    }
    if (config.replicaSet) {
      options.replicaSet = config.replicaSet;
    }

    this.client = new MongoClient(config.uri, options);
    this.database = config.database;
    this.collection = config.collection;
  }

  async connect(): Promise<void> {
    await this.client.connect();
    getLogger().info(
      { database: this.database, collection: this.collection },
      "Connected to MongoDB"
    );
  }

  watch(resumeAfter?: ResumeToken): AsyncIterable<ChangeStreamDocument> {
    const logger = getLogger();
    const db = this.client.db(this.database);
    const target = this.collection ? db.collection(this.collection) : db;
    const options: Record<string, unknown> = {};

    if (resumeAfter) {
      options.resumeAfter = resumeAfter;
      logger.info("Resuming from saved token");
    }

    this.stream = target.watch([], options);
    logger.info("Change stream opened");
    return this.stream as AsyncIterable<ChangeStreamDocument>;
  }

  async close(): Promise<void> {
    if (this.stream) {
      await this.stream.close();
    }
    await this.client.close();
    getLogger().info("MongoDB connection closed");
  }
}
