import type { ISink } from "../interfaces/index.js";
import { getLogger } from "../util/logger.js";

export class ConsoleSink implements ISink {
  async connect(): Promise<void> {
    getLogger().info("ConsoleSink connected");
  }

  async publish(data: unknown, key?: string): Promise<void> {
    const logger = getLogger();
    logger.info({ key, data }, "CDC event");
  }

  async disconnect(): Promise<void> {
    getLogger().info("ConsoleSink disconnected");
  }
}
