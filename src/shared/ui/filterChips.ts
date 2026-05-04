import type { ActiveFilterChip } from './EntityListToolbar';

export function compactFilterChips(
  entries: Array<ActiveFilterChip | null | undefined>
): ActiveFilterChip[] {
  return entries.filter(Boolean) as ActiveFilterChip[];
}
