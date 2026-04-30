# mongo-cdc

MongoDB Change Data Capture (CDC) stream consumer with configurable filtering, transformation, and sinks.

Watches a MongoDB database or collection for changes and routes events through a pluggable pipeline: **filter -> transform -> sink**.

## Prerequisites

- Node.js 20+
- MongoDB replica set (change streams require a replica set)

## Quick Start

```bash
# Install dependencies
npm install

# Development (runs TypeScript directly)
npm run dev -- --mongo-uri mongodb://localhost:27017 --mongo-database mydb

# Build and run
npm run build
npm start -- --mongo-uri mongodb://localhost:27017 --mongo-database mydb
```

## Docker

### Build the image

```bash
docker build -t mongo-cdc .
```

### Run the image

```bash
docker run --rm \
  -e MONGO_URI=mongodb://host.docker.internal:27017 \
  -e MONGO_DATABASE=mydb \
  -e SINK_TYPE=console \
  -e RESUME_TOKEN_ENABLED=true \
  mongo-cdc
```

### Docker Compose

The included `docker-compose.yml` starts MongoDB (replica set), Kafka, Kafka UI, and the CDC consumer:

```bash
docker compose up -d
```

This starts:
- **MongoDB 7** on port 27017 (auto-initializes replica set `rs0`)
- **Kafka 3.7** on port 9092 (KRaft mode, auto-creates topics)
- **Kafka UI** on port 8080 — browse topics and inspect messages at http://localhost:8080
- **mongo-cdc** consuming from MongoDB and publishing to Kafka

## Configuration

All options can be set via CLI flags or environment variables.

### MongoDB Connection

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--mongo-uri <uri>` | `MONGO_URI` | `mongodb://localhost:27017` | Connection string |
| `--mongo-database <db>` | `MONGO_DATABASE` | *required* | Database to watch |
| `--mongo-collection <col>` | `MONGO_COLLECTION` | *(all)* | Specific collection to watch |
| `--mongo-username <user>` | `MONGO_USERNAME` | | Auth username |
| `--mongo-password <pass>` | `MONGO_PASSWORD` | | Auth password |
| `--mongo-auth-source <db>` | `MONGO_AUTH_SOURCE` | | Auth database |
| `--mongo-replica-set <name>` | `MONGO_REPLICA_SET` | | Replica set name |

### Sink

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--sink <type>` | `SINK_TYPE` | `console` | `console`, `kafka`, or path to custom module |

### Kafka (when sink is `kafka`)

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--kafka-brokers <list>` | `KAFKA_BROKERS` | `localhost:9092` | Comma-separated broker list |
| `--kafka-topic <topic>` | `KAFKA_TOPIC` | `mongo-cdc-events` | Target topic |
| `--kafka-client-id <id>` | `KAFKA_CLIENT_ID` | `mongo-cdc` | Client ID |
| `--kafka-sasl-mechanism <mech>` | `KAFKA_SASL_MECHANISM` | | `plain`, `scram-sha-256`, `scram-sha-512` |
| `--kafka-sasl-username <user>` | `KAFKA_SASL_USERNAME` | | SASL username |
| `--kafka-sasl-password <pass>` | `KAFKA_SASL_PASSWORD` | | SASL password |
| `--kafka-ssl` | `KAFKA_SSL` | `false` | Enable SSL |

### Filter

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--filter <type>` | `FILTER_TYPE` | `passthrough` | `passthrough`, `operation-type`, or path to custom module |
| `--filter-options <json>` | `FILTER_OPTIONS` | | JSON options passed to the filter |

**operation-type filter example:**

```bash
--filter operation-type --filter-options '{"operations":["insert","delete"]}'
```

### Transformer

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--transformer <type>` | `TRANSFORMER_TYPE` | `identity` | `identity` or path to custom module |
| `--transformer-options <json>` | `TRANSFORMER_OPTIONS` | | JSON options passed to the transformer |

### Resume Token

Resume tokens track the last processed change stream position so the consumer can resume after restarts.

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--resume-token` | `RESUME_TOKEN_ENABLED` | `false` | Enable resume token persistence |
| `--resume-token-mongo-uri <uri>` | `RESUME_TOKEN_MONGO_URI` | *(uses --mongo-uri)* | MongoDB URI for token store |
| `--resume-token-mongo-database <db>` | `RESUME_TOKEN_MONGO_DATABASE` | `cdc_metadata` | Database for token store (must differ from watched DB) |
| `--resume-token-mongo-collection <col>` | `RESUME_TOKEN_MONGO_COLLECTION` | `cdc_resume_tokens` | Collection name |
| `--resume-token-pipeline-id <id>` | `RESUME_TOKEN_PIPELINE_ID` | `default` | Pipeline identifier |

Resume tokens are stored in a MongoDB collection. Defaults to the same MongoDB instance being watched (in a separate `cdc_metadata` database to avoid the change stream feeding back on its own token writes), but can point to a separate instance. Multiple pipelines can share the same collection using different `--resume-token-pipeline-id` values.

```bash
# Reuses source connection
--resume-token

# Separate instance
--resume-token \
  --resume-token-mongo-uri mongodb://checkpoint-host:27017 \
  --resume-token-mongo-database checkpoints
```

### Logging

| CLI Flag | Env Variable | Default | Description |
|---|---|---|---|
| `--log-level <level>` | `LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error`, `fatal` |

## Custom Plugins

Filters, transformers, and sinks can be extended by providing a path to a module that exports a `create` function.

### Custom Sink

```typescript
// my-sink.ts
import type { ISink } from "mongo-cdc/interfaces";

export function create(config: AppConfig): ISink {
  return {
    async connect() { /* ... */ },
    async publish(data: unknown, key?: string) { /* ... */ },
    async disconnect() { /* ... */ },
  };
}
```

```bash
--sink ./my-sink.js
```

### Custom Filter

```typescript
// my-filter.ts
import type { IChangeEventFilter } from "mongo-cdc/interfaces";

export function create(options?: Record<string, unknown>): IChangeEventFilter {
  return {
    shouldProcess(event) { /* return true/false */ },
  };
}
```

```bash
--filter ./my-filter.js --filter-options '{"key":"value"}'
```

### Custom Transformer

```typescript
// my-transformer.ts
import type { IChangeEventTransformer } from "mongo-cdc/interfaces";

export function create(options?: Record<string, unknown>): IChangeEventTransformer {
  return {
    transform(event) { /* return transformed event */ },
  };
}
```

```bash
--transformer ./my-transformer.js
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Architecture

```
MongoDB Change Stream
        |
    [Filter] ---- discard event
        |
  [Transformer]
        |
      [Sink] ---- console / kafka / custom
        |
  [Resume Token Store] ---- mongo
```

The pipeline automatically reconnects on change stream errors with exponential backoff (1s up to 30s).

## Examples

**Watch all changes and log to console:**

```bash
npm run dev -- --mongo-database mydb
```

**Watch a single collection, filter inserts only, publish to Kafka:**

```bash
npm run dev -- \
  --mongo-database mydb \
  --mongo-collection users \
  --filter operation-type \
  --filter-options '{"operations":["insert"]}' \
  --sink kafka \
  --kafka-brokers localhost:9092 \
  --kafka-topic user-events \
  --resume-token
```

**Production Docker deployment:**

```bash
docker run -d --name mongo-cdc \
  -e MONGO_URI=mongodb://mongo1:27017,mongo2:27017,mongo3:27017 \
  -e MONGO_DATABASE=production \
  -e MONGO_REPLICA_SET=rs0 \
  -e SINK_TYPE=kafka \
  -e KAFKA_BROKERS=kafka1:9092,kafka2:9092 \
  -e KAFKA_TOPIC=cdc-events \
  -e KAFKA_SSL=true \
  -e KAFKA_SASL_MECHANISM=scram-sha-512 \
  -e KAFKA_SASL_USERNAME=cdc-producer \
  -e KAFKA_SASL_PASSWORD=secret \
  -e RESUME_TOKEN_ENABLED=true \
  -e LOG_LEVEL=info \
  --restart unless-stopped \
  mongo-cdc
```
