export interface ISink {
  connect(): Promise<void>;
  publish(data: unknown, key?: string): Promise<void>;
  disconnect(): Promise<void>;
}
