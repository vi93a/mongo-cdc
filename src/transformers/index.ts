import type { IChangeEventTransformer } from "../interfaces/index.js";
import { loadModule } from "../util/module-loader.js";
import { IdentityTransformer } from "./IdentityTransformer.js";

export async function createTransformer(
  type: string,
  options?: Record<string, unknown>
): Promise<IChangeEventTransformer> {
  switch (type) {
    case "identity":
      return new IdentityTransformer();
    default: {
      const Ctor = await loadModule<IChangeEventTransformer>(type);
      return new Ctor(options);
    }
  }
}

export { IdentityTransformer } from "./IdentityTransformer.js";
