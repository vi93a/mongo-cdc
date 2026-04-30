import { parseCli, validateConfig } from "./config/index.js";
import { initLogger, getLogger } from "./util/logger.js";
import { createFilter } from "./filters/index.js";
import { createTransformer } from "./transformers/index.js";
import { createSink } from "./sinks/index.js";
import { MongoChangeStream } from "./source/MongoChangeStream.js";
import { MongoResumeTokenStore } from "./pipeline/MongoResumeTokenStore.js";
import { Pipeline } from "./pipeline/Pipeline.js";

async function main(): Promise<void> {
  const config = parseCli(process.argv);
  initLogger(config.logLevel);

  const logger = getLogger();
  logger.info("Starting mongo-cdc");

  validateConfig(config);

  const [filter, transformer, sink] = await Promise.all([
    createFilter(config.filter.type, config.filter.options),
    createTransformer(config.transformer.type, config.transformer.options),
    createSink(config),
  ]);

  const source = new MongoChangeStream(config.mongo);
  const resumeTokenStore = new MongoResumeTokenStore(
    config.resumeToken.mongoUri ?? config.mongo.uri,
    config.resumeToken.mongoDatabase,
    config.resumeToken.mongoCollection,
    config.resumeToken.pipelineId,
    config.resumeToken.enabled
  );

  if (
    (config.resumeToken.mongoUri ?? config.mongo.uri) === config.mongo.uri &&
    config.resumeToken.mongoDatabase === config.mongo.database
  ) {
    throw new Error(
      "Resume token database cannot be the same as the watched database " +
        `(both are "${config.mongo.database}") — this would create a feedback loop. ` +
        "Set --resume-token-mongo-database to a different database."
    );
  }

  const pipeline = new Pipeline(source, filter, transformer, sink, resumeTokenStore);

  const shutdown = async () => {
    logger.info("Received shutdown signal");
    await pipeline.stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  await pipeline.start();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
