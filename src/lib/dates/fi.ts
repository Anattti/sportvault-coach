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

export function formatTimeFi(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateTimeFi(date: Date): string {
  return `${formatDateFi(date)} klo ${formatTimeFi(date)}`;
}

/** Näytä kellonaika vain jos se ei ole keskiyö (vanhat päivämäärä-only -tallenteet). */
export function hasMeaningfulSessionTime(date: Date): boolean {
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
}

export function formatSessionDateTimeFi(date: Date): string {
  if (hasMeaningfulSessionTime(date)) {
    return formatDateTimeFi(date);
  }
  return formatDateFi(date);
}

/** Lyhyempi muoto listanäkymiin: "Ma 9.6. klo 14:32" */
export function formatSessionDateTimeShortFi(date: Date): string {
  const weekday = WEEKDAYS_SHORT[date.getDay()];
  const base = `${weekday} ${date.getDate()}.${date.getMonth() + 1}.`;
  if (hasMeaningfulSessionTime(date)) {
    return `${base} klo ${formatTimeFi(date)}`;
  }
  return base;
}
