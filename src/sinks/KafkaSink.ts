import { Kafka, type Producer, type KafkaConfig, type SASLOptions } from "kafkajs";
import type { ISink } from "../interfaces/index.js";
import type { AppConfig } from "../config/schema.js";
import { getLogger } from "../util/logger.js";

export class KafkaSink implements ISink {
  private producer: Producer;
  private topic: string;

  constructor(config: AppConfig["kafka"]) {
    const kafkaConfig: KafkaConfig = {
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl || undefined,
    };

    if (config.sasl) {
      kafkaConfig.sasl = {
        mechanism: config.sasl.mechanism,
        username: config.sasl.username,
        password: config.sasl.password,
      } as SASLOptions;
    }

    const kafka = new Kafka(kafkaConfig);
    this.producer = kafka.producer();
    this.topic = config.topic;
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    getLogger().info({ topic: this.topic }, "KafkaSink connected");
  }

  async publish(data: unknown, key?: string): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: key ?? null,
          value: JSON.stringify(data),
        },
      ],
    });
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    getLogger().info("KafkaSink disconnected");
  }
}
