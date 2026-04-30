export interface AppConfig {
  mongo: {
    uri: string;
    database: string;
    collection?: string;
    username?: string;
    password?: string;
    authSource?: string;
    replicaSet?: string;
  };
  sink: {
    type: string;
  };
  filter: {
    type: string;
    options?: Record<string, unknown>;
  };
  transformer: {
    type: string;
    options?: Record<string, unknown>;
  };
  kafka: {
    brokers: string[];
    topic: string;
    clientId: string;
    sasl?: {
      mechanism: "plain" | "scram-sha-256" | "scram-sha-512";
      username: string;
      password: string;
    };
    ssl: boolean;
  };
  resumeToken: {
    enabled: boolean;
    mongoUri?: string;
    mongoDatabase: string;
    mongoCollection?: string;
    pipelineId?: string;
  };
  logLevel: string;
}

export function validateConfig(config: AppConfig): void {
  if (!config.mongo.uri) {
    throw new Error("MongoDB URI is required (--mongo-uri or MONGO_URI)");
  }
  if (!config.mongo.database) {
    throw new Error(
      "MongoDB database is required (--mongo-database or MONGO_DATABASE)"
    );
  }
  if (config.sink.type === "kafka") {
    if (!config.kafka.brokers.length || config.kafka.brokers[0] === "") {
      throw new Error(
        "Kafka brokers are required when using kafka sink (--kafka-brokers or KAFKA_BROKERS)"
      );
    }
    if (!config.kafka.topic) {
      throw new Error(
        "Kafka topic is required when using kafka sink (--kafka-topic or KAFKA_TOPIC)"
      );
    }
  }
}
