import { fuzzySearch } from '@thisbeyond/solid-select';

export type FuzzySearchResult = ReturnType<typeof fuzzySearch>;

export type FuzzySortResult<T> = {
  index: number;
  item: T;
  score: number;
};

// Original implementation: https://github.com/thisbeyond/solid-select/blob/main/src/fuzzy.tsx
// Original license: MIT License, Copyright (c) 2022 Martin Pengelly-Phillips

export function fuzzySort<T>(value: string, items: T[], keys: Array<keyof T>) {
  const sorted: FuzzySortResult<T>[] = [];

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    let score = 0;
    for (const key of keys) {
      const result = fuzzySearch(value, item[key] as string);
      score += result.score;
    }
    if (score) {
      sorted.push({ item, index, score });
    }
  }

  sorted.sort((a, b) => {
    let delta = b.score - a.score;
    if (delta === 0) {
      delta = a.index - b.index;
    }
    return delta;
  });

  return sorted;
}
