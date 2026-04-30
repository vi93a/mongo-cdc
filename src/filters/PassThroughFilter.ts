import type { ChangeStreamDocument } from "mongodb";
import type { IChangeEventFilter } from "../interfaces/index.js";

export class PassThroughFilter implements IChangeEventFilter {
  shouldProcess(_event: ChangeStreamDocument): boolean {
    return true;
  }
}
