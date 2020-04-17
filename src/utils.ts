export const sortAsc = (a: number, b: number) => a - b

export function flatMap<T, U>(
  arr: T[],
  mapper: (value: T, index: number, array: T[]) => U[]
): U[] {
  return arr.reduce((acc, val, i) => {
    acc.push(...mapper(val, i, arr))
    return acc
  }, <U[]>[])
}
