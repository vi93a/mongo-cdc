import { Command } from "commander";
import type { AppConfig } from "./schema.js";

function parseJsonOption(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON: ${value}`);
  }
}

export function parseCli(argv: string[]): AppConfig {
  const program = new Command();

  program
    .name("mongo-cdc")
    .description("MongoDB CDC Stream Consumer")
    .option("--mongo-uri <uri>", "MongoDB connection string", process.env.MONGO_URI ?? "mongodb://localhost:27017")
    .option("--mongo-database <db>", "Database to watch", process.env.MONGO_DATABASE)
    .option("--mongo-collection <col>", "Collection to watch", process.env.MONGO_COLLECTION)
    .option("--mongo-username <user>", "Auth username", process.env.MONGO_USERNAME)
    .option("--mongo-password <pass>", "Auth password", process.env.MONGO_PASSWORD)
    .option("--mongo-auth-source <db>", "Auth database", process.env.MONGO_AUTH_SOURCE)
    .option("--mongo-replica-set <name>", "Replica set name", process.env.MONGO_REPLICA_SET)
    .option("--sink <type>", "Sink type: kafka, console, or module path", process.env.SINK_TYPE ?? "console")
    .option("--filter <type>", "Filter: passthrough, operation-type, or module path", process.env.FILTER_TYPE ?? "passthrough")
    .option("--filter-options <json>", "JSON string of filter options", process.env.FILTER_OPTIONS)
    .option("--transformer <type>", "Transformer: identity or module path", process.env.TRANSFORMER_TYPE ?? "identity")
    .option("--transformer-options <json>", "JSON string of transformer options", process.env.TRANSFORMER_OPTIONS)
    .option("--kafka-brokers <brokers>", "Comma-separated broker list", process.env.KAFKA_BROKERS ?? "localhost:9092")
    .option("--kafka-topic <topic>", "Target Kafka topic", process.env.KAFKA_TOPIC ?? "mongo-cdc-events")
    .option("--kafka-client-id <id>", "Kafka client ID", process.env.KAFKA_CLIENT_ID ?? "mongo-cdc")
    .option("--kafka-sasl-mechanism <mech>", "SASL mechanism", process.env.KAFKA_SASL_MECHANISM)
    .option("--kafka-sasl-username <user>", "SASL username", process.env.KAFKA_SASL_USERNAME)
    .option("--kafka-sasl-password <pass>", "SASL password", process.env.KAFKA_SASL_PASSWORD)
    .option("--kafka-ssl", "Enable SSL", process.env.KAFKA_SSL === "true")
    .option("--resume-token", "Enable resume token persistence", process.env.RESUME_TOKEN_ENABLED === "true")
    .option("--resume-token-mongo-uri <uri>", "MongoDB URI for resume token store (defaults to --mongo-uri)", process.env.RESUME_TOKEN_MONGO_URI)
    .option("--resume-token-mongo-database <db>", "Database for resume token store", process.env.RESUME_TOKEN_MONGO_DATABASE ?? "cdc_metadata")
    .option("--resume-token-mongo-collection <col>", "Collection for resume tokens", process.env.RESUME_TOKEN_MONGO_COLLECTION ?? "cdc_resume_tokens")
    .option("--resume-token-pipeline-id <id>", "Pipeline ID for resume token", process.env.RESUME_TOKEN_PIPELINE_ID ?? "default")
    .option("--log-level <level>", "Log level", process.env.LOG_LEVEL ?? "info");

  program.parse(argv);
  const opts = program.opts();

  const sasl = opts.kafkaSaslMechanism
    ? {
        mechanism: opts.kafkaSaslMechanism as "plain" | "scram-sha-256" | "scram-sha-512",
        username: opts.kafkaSaslUsername ?? "",
        password: opts.kafkaSaslPassword ?? "",
      }
    : undefined;

  return {
    mongo: {
      uri: opts.mongoUri,
      database: opts.mongoDatabase,
      collection: opts.mongoCollection,
      username: opts.mongoUsername,
      password: opts.mongoPassword,
      authSource: opts.mongoAuthSource,
      replicaSet: opts.mongoReplicaSet,
    },
    sink: { type: opts.sink },
    filter: {
      type: opts.filter,
      options: parseJsonOption(opts.filterOptions),
    },
    transformer: {
      type: opts.transformer,
      options: parseJsonOption(opts.transformerOptions),
    },
    kafka: {
      brokers: opts.kafkaBrokers.split(","),
      topic: opts.kafkaTopic,
      clientId: opts.kafkaClientId,
      sasl,
      ssl: opts.kafkaSsl ?? false,
    },
    resumeToken: {
      enabled: opts.resumeToken ?? false,
      mongoUri: opts.resumeTokenMongoUri,
      mongoDatabase: opts.resumeTokenMongoDatabase,
      mongoCollection: opts.resumeTokenMongoCollection,
      pipelineId: opts.resumeTokenPipelineId,
    },
    logLevel: opts.logLevel,
  };
}
