import {
  buildOccurrence,
  generateDaily,
  generateMonthly,
  generateWeekly,
} from './recurrence.helper';

describe('recurrence.helper', () => {
  it('UTCID01 should generate weekly instances with inherited 60-minute duration', () => {
    const series = {
      recurrenceType: 'WEEKLY',
      weeklyDay: ['WED'],
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
    };

    const from = new Date('2026-05-20T00:00:00.000Z');
    const to = new Date('2026-06-03T23:59:59.000Z');

    const result = generateWeekly(series, from, to);

    expect(result).toHaveLength(3);
    expect(result[0].start.toISOString()).toBe('2026-05-20T09:00:00.000Z');
    expect(result[1].start.toISOString()).toBe('2026-05-27T09:00:00.000Z');
    expect(result[2].start.toISOString()).toBe('2026-06-03T09:00:00.000Z');
    expect(result[0].end.getTime() - result[0].start.getTime()).toBe(
      60 * 60 * 1000,
    );
  });

  it('UTCID02 should generate two monthly instances for COUNT-like two-month window', () => {
    const series = {
      recurrenceType: 'MONTHLY',
      monthlyDay: 20,
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
    };

    const from = new Date('2026-05-20T00:00:00.000Z');
    const to = new Date('2026-06-20T23:59:59.000Z');

    const result = generateMonthly(series, from, to);

    expect(result).toHaveLength(2);
    expect(result[0].start.toISOString()).toBe('2026-05-20T09:00:00.000Z');
    expect(result[1].start.toISOString()).toBe('2026-06-20T09:00:00.000Z');
  });

  it('UTCID03 should generate exactly 50 daily instances on boundary window', () => {
    const series = {
      recurrenceType: 'DAILY',
      startAt: new Date('2026-05-20T09:00:00.000Z'),
      endAt: new Date('2026-05-20T10:00:00.000Z'),
    };

    const from = new Date('2026-05-20T00:00:00.000Z');
    const to = new Date('2026-07-08T23:59:59.000Z');

    const result = generateDaily(series, from, to);

    expect(result).toHaveLength(50);
  });

  it('UTCID18 should build cross-day occurrence when end time is earlier than start time', () => {
    const series = {
      startAt: new Date('2026-05-20T23:00:00.000Z'),
      endAt: new Date('2026-05-20T01:00:00.000Z'),
    };

    const baseDate = new Date('2026-05-20T00:00:00.000Z');
    const occ = buildOccurrence(series, baseDate);

    expect(occ.start.toISOString()).toBe('2026-05-20T23:00:00.000Z');
    expect(occ.end.toISOString()).toBe('2026-05-21T01:00:00.000Z');
    expect(occ.end.getTime()).toBeGreaterThan(occ.start.getTime());
  });
});
