import type { ChangeStreamDocument } from "mongodb";
import type { IChangeEventFilter } from "../interfaces/index.js";

export class OperationTypeFilter implements IChangeEventFilter {
  private readonly operations: Set<string>;

  constructor(options?: Record<string, unknown>) {
    const ops = options?.operations;
    if (Array.isArray(ops)) {
      this.operations = new Set(ops.map(String));
    } else {
      this.operations = new Set(["insert", "update", "delete", "replace"]);
    }
  }

  shouldProcess(event: ChangeStreamDocument): boolean {
    return this.operations.has(event.operationType);
  }
}
