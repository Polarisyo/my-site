export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getYear(date: Date): number {
  return date.getFullYear();
}

export function groupByYear<T extends { data: { date: Date } }>(
  entries: T[]
): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const entry of entries) {
    const year = getYear(entry.data.date);
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(entry);
  }
  return groups;
}

export function sortByDateDesc<T extends { data: { date: Date } }>(
  entries: T[]
): T[] {
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function sortByDateAsc<T extends { data: { date: Date } }>(
  entries: T[]
): T[] {
  return entries.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
}