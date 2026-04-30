import type { IChangeEventFilter } from "../interfaces/index.js";
import { loadModule } from "../util/module-loader.js";
import { PassThroughFilter } from "./PassThroughFilter.js";
import { OperationTypeFilter } from "./OperationTypeFilter.js";

export async function createFilter(
  type: string,
  options?: Record<string, unknown>
): Promise<IChangeEventFilter> {
  switch (type) {
    case "passthrough":
      return new PassThroughFilter();
    case "operation-type":
      return new OperationTypeFilter(options);
    default: {
      const Ctor = await loadModule<IChangeEventFilter>(type);
      return new Ctor(options);
    }
  }
}

export { PassThroughFilter } from "./PassThroughFilter.js";
export { OperationTypeFilter } from "./OperationTypeFilter.js";
