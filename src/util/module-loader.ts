import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export async function loadModule<T>(modulePath: string): Promise<new (...args: unknown[]) => T> {
  const absolute = resolve(modulePath);
  const url = pathToFileURL(absolute).href;
  const mod = await import(url);
  const Ctor = mod.default ?? mod;
  if (typeof Ctor !== "function") {
    throw new Error(`Module at ${modulePath} does not export a class or constructor`);
  }
  return Ctor as new (...args: unknown[]) => T;
}
