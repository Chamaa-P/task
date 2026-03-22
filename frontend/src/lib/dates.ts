export function parseDueDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().slice(0, 10);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const fallback = new Date(value);

  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDueDate(value?: string | null): string {
  const dueDate = parseDueDate(value);

  if (!dueDate) {
    return 'No due date';
  }

  return dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isDueDateOverdue(value?: string | null, status?: string): boolean {
  const dueDate = parseDueDate(value);

  if (!dueDate || status === 'completed' || status === 'archived') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate.getTime() < today.getTime();
}
