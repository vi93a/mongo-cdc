import pino from "pino";

let logger = pino({ level: "info" });

export function initLogger(level: string): void {
  logger = pino({ level });
}

export function getLogger(): pino.Logger {
  return logger;
}
