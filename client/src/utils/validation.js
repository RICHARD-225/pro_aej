export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value || '').trim());
}

export function isValidCalendarDate(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/) || raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const [, first, second, third] = match;
  const [year, month, day] = raw.includes('-') ? [first, second, third] : [third, second, first];
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
}

export function isDateRangeValid(start, end) {
  if (!isValidCalendarDate(start) || !isValidCalendarDate(end)) return false;
  const parse = (value) => new Date(`${value.includes('-') ? value : value.split('/').reverse().join('-')}T00:00:00`).getTime();
  return parse(end) >= parse(start);
}
