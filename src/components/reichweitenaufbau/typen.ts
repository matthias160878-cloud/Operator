/** Server → Client: Datumswerte werden zu ISO-Strings. */
export type Plain<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Plain<U>[]
    : T extends object
      ? { [K in keyof T]: Plain<T[K]> }
      : T;

export function plain<T>(x: T): Plain<T> {
  return JSON.parse(JSON.stringify(x)) as Plain<T>;
}
