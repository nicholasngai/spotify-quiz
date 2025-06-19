export function shuffle<T>(arr: T[]): T[] {
  for (let i = 0; i < arr.length - 1; i++) {
    const j = Math.floor(Math.random() * (arr.length - i)) + i;
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
