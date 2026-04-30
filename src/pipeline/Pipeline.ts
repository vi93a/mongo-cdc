import type { ChangeStreamDocument } from "mongodb";
import type { IChangeEventFilter } from "../interfaces/index.js";
import type { IChangeEventTransformer } from "../interfaces/index.js";
import type { IResumeTokenStore } from "../interfaces/index.js";
import type { ISink } from "../interfaces/index.js";
import { MongoChangeStream } from "../source/MongoChangeStream.js";
import { getLogger } from "../util/logger.js";

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export class Pipeline {
  private running = false;

  constructor(
    private readonly source: MongoChangeStream,
    private readonly filter: IChangeEventFilter,
    private readonly transformer: IChangeEventTransformer,
    private readonly sink: ISink,
    private readonly resumeTokenStore: IResumeTokenStore
  ) {}

  async start(): Promise<void> {
    const logger = getLogger();
    this.running = true;

    await this.source.connect();
    await this.sink.connect();

    let backoff = INITIAL_BACKOFF_MS;
    const resumeToken = await this.resumeTokenStore.load();

    while (this.running) {
      try {
        const stream = this.source.watch(resumeToken);

        for await (const event of stream) {
          if (!this.running) break;

          if (!this.filter.shouldProcess(event)) {
            logger.debug({ op: event.operationType }, "Event filtered out");
            continue;
          }

          const transformed = this.transformer.transform(event);
          const key = extractKey(event);

          await this.sink.publish(transformed, key);
          await this.resumeTokenStore.save(event._id);

          logger.debug({ op: event.operationType, key }, "Event processed");
          backoff = INITIAL_BACKOFF_MS;
        }
      } catch (err) {
        if (!this.running) break;
        logger.error({ err, backoff }, "Change stream error, reconnecting");
        await sleep(backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    }
  }

  async stop(): Promise<void> {
    const logger = getLogger();
    logger.info("Shutting down pipeline");
    this.running = false;
    await this.source.close();
    await this.resumeTokenStore.close();
    await this.sink.disconnect();
    logger.info("Pipeline stopped");
  }
}

function extractKey(event: ChangeStreamDocument): string | undefined {
  if ("documentKey" in event && event.documentKey) {
    const id = (event.documentKey as Record<string, unknown>)._id;
    return id != null ? String(id) : undefined;
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
