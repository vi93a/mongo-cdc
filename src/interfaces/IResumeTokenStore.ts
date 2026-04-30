import type { ResumeToken } from "mongodb";

export interface IResumeTokenStore {
  load(): Promise<ResumeToken | undefined>;
  save(token: ResumeToken): Promise<void>;
  close(): Promise<void>;
}
