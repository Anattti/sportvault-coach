const MONTHS_NOMINATIVE = [
  'Tammikuu',
  'Helmikuu',
  'Maaliskuu',
  'Huhtikuu',
  'Toukokuu',
  'Kesäkuu',
  'Heinäkuu',
  'Elokuu',
  'Syyskuu',
  'Lokakuu',
  'Marraskuu',
  'Joulukuu',
] as const;

/** Su, Ma, Ti… (getDay: 0 = sunnuntai) */
const WEEKDAYS_SHORT = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'] as const;

export function formatMonthYearFi(date: Date): string {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekdayShortFi(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}

export function formatDateFi(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function formatMonthDayFi(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}
