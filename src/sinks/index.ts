import type { ISink } from "../interfaces/index.js";
import type { AppConfig } from "../config/schema.js";
import { loadModule } from "../util/module-loader.js";
import { ConsoleSink } from "./ConsoleSink.js";
import { KafkaSink } from "./KafkaSink.js";

export async function createSink(config: AppConfig): Promise<ISink> {
  switch (config.sink.type) {
    case "console":
      return new ConsoleSink();
    case "kafka":
      return new KafkaSink(config.kafka);
    default: {
      const Ctor = await loadModule<ISink>(config.sink.type);
      return new Ctor(config);
    }
  }
}

export { ConsoleSink } from "./ConsoleSink.js";
export { KafkaSink } from "./KafkaSink.js";
