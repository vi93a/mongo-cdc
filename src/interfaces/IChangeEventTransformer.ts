import type { ChangeStreamDocument } from "mongodb";

export interface IChangeEventTransformer {
  transform(event: ChangeStreamDocument): unknown;
}
