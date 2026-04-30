import type { ChangeStreamDocument } from "mongodb";

export interface IChangeEventFilter {
  shouldProcess(event: ChangeStreamDocument): boolean;
}
