export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export const DATE_FILTER_OPTIONS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function matchesDateFilter(isoValue, filter) {
  if (!filter || filter === "all") return true;
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }
  const days = Number(filter);
  if (!Number.isFinite(days)) return true;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

export function paginateItems(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    safePage,
    start,
    end: Math.min(start + pageSize, items.length),
  };
}
