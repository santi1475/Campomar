
export interface PeruRange {
  start: Date;
  end: Date;
}

function buildPeruDayStart(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 5, 0, 0, 0));
}
function buildPeruDayEnd(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day + 1, 4, 59, 59, 999));
}

function extractYMD(value: string): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const datePart = value.split('T')[0];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!m) return null;
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10) - 1, d: parseInt(m[3], 10) };
}

export function normalizePeruRange(startDate?: string | null, endDate?: string | null): PeruRange | null {
  if (!startDate || !endDate) return null;
  const startYMD = extractYMD(startDate);
  const endYMD = extractYMD(endDate);
  if (!startYMD || !endYMD) return null;
  return {
    start: buildPeruDayStart(startYMD.y, startYMD.m, startYMD.d),
    end: buildPeruDayEnd(endYMD.y, endYMD.m, endYMD.d),
  };
}

export function peruPresetRange(preset: 'today' | 'last7' | 'last30' | 'year'): PeruRange {
  const nowUTC = new Date();
  const limaNow = new Date(nowUTC.getTime() - 5 * 60 * 60 * 1000);
  const y = limaNow.getUTCFullYear();
  const m = limaNow.getUTCMonth();
  const d = limaNow.getUTCDate();

  const todayStart = buildPeruDayStart(y, m, d);
  const todayEnd = buildPeruDayEnd(y, m, d);

  if (preset === 'today') return { start: todayStart, end: todayEnd };
  if (preset === 'year') {
    const yearStart = buildPeruDayStart(y, 0, 1);
    return { start: yearStart, end: todayEnd };
  }
  const days = preset === 'last7' ? 6 : 29;
  const pastStart = new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: pastStart, end: todayEnd };
}
