import type { ChangeStreamDocument } from "mongodb";
import type { IChangeEventTransformer } from "../interfaces/index.js";

export class IdentityTransformer implements IChangeEventTransformer {
  transform(event: ChangeStreamDocument): unknown {
    return event;
  }
}
