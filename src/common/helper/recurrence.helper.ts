export type Occurrence = {
  start: Date;
  end: Date;
};

export function buildOccurrence(series: any, date: Date): Occurrence {
  const start = new Date(date);
  const end = new Date(date);

  start.setUTCHours(
    series.startAt.getUTCHours(),
    series.startAt.getUTCMinutes(),
    0,
    0,
  );

  end.setUTCHours(
    series.endAt.getUTCHours(),
    series.endAt.getUTCMinutes(),
    0,
    0,
  );

  // 🔥 FIX CROSS-DAY (cốt lõi)
  if (end <= start) {
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
}

export function generateOccurrences(series: any, from: Date, to: Date): Occurrence[] {
  switch (series.recurrenceType) {
    case 'DAILY':
      return generateDaily(series, from, to);

    case 'WEEKLY':
      return generateWeekly(series, from, to);

    case 'MONTHLY':
      return generateMonthly(series, from, to);

    case 'YEARLY':
      return generateYearly(series, from, to);
    case 'ONETIME':
      return generateOneTime(series, from, to);

    default:
      return [];
  }
}

// ================= ONETIME =================
export function generateOneTime(series: any, from: Date, to: Date): Occurrence[] {
  const start = new Date(series.startAt);
  const end = new Date(series.endAt);

  if (start < to && end > from) {
    return [{ start, end }];
  }

  return [];
}

export function generateDaily(series: any, from: Date, to: Date): Occurrence[] {
  const result: Occurrence[] = [];
  let cursor = new Date(from);

  while (cursor <= to) {
    result.push(buildOccurrence(series, cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

export function generateWeekly(series: any, from: Date, to: Date) {
  const result: Occurrence[] = [];
  const map = [
    'SUN', 'MON', 'TUE', 'WED',
    'THU', 'FRI', 'SAT', 'SUN'
  ];

  let cursor = new Date(from);

  while (cursor <= to) {
    const weekday = map[cursor.getUTCDay()];

    if (series.weeklyDay.includes(weekday)) {
      result.push(buildOccurrence(series, cursor));
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

export function generateMonthly(series: any, from: Date, to: Date) {
  const result: Occurrence[] = [];

  let cursor = new Date(from);

  while (cursor <= to) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    const target = new Date(Date.UTC(year, month, series.monthlyDay));
    const occ = buildOccurrence(series, target);

    if (occ.start < to && occ.end > from) {
      result.push(occ);
    }

    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return result;
}

export function generateYearly(series: any, from: Date, to: Date) {
  const result: Occurrence[] = [];

  let year = from.getUTCFullYear();

  while (year <= to.getUTCFullYear()) {
    const target = new Date(Date.UTC(
      year,
      series.yearlyMonth - 1,
      series.yearlyDay
    ));
    const occ = buildOccurrence(series, target);

    if (occ.start < to && occ.end > from) {
      result.push(occ);
    }

    year++;
  }

  return result;
}
