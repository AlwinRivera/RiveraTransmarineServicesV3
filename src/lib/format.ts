import dayjs from 'dayjs';

export const todayISO = () => dayjs().format('YYYY-MM-DD');
export const addDays = (iso: string, n: number) => dayjs(iso).add(n, 'day').format('YYYY-MM-DD');
export const daysBetween = (from: string, to: string) => dayjs(to).diff(dayjs(from), 'day');

/** "Wed 5 Nov" */
export const shortDate = (iso: string) => dayjs(iso).format('ddd D MMM');
/** "Wednesday, 5 November" */
export const longDate = (iso: string) => dayjs(iso).format('dddd, D MMMM');
/** "5 Nov, 2:30 PM" */
export const dateTime = (iso: string) => dayjs(iso).format('D MMM, h:mm A');

export function dateRange(start: string, end: string) {
  if (start === end) return shortDate(start);
  const s = dayjs(start);
  const e = dayjs(end);
  if (s.month() === e.month()) return `${s.format('ddd D')} to ${e.format('ddd D MMM')}`;
  return `${s.format('ddd D MMM')} to ${e.format('ddd D MMM')}`;
}

/** Plain words for how far a date is from today. */
export function relativeDay(iso: string) {
  const d = daysBetween(todayISO(), iso);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  if (d > 1 && d < 7) return dayjs(iso).format('dddd');
  return shortDate(iso);
}

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
export const money = (n: number) => peso.format(n);

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function trackingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const PORTS = [
  'Cebu',
  'Mandaue',
  'Tagbilaran',
  'Ormoc',
  'Dumaguete',
  'Surigao',
  'Cagayan de Oro',
  'Iloilo',
  'Masbate',
  'Ozamiz',
  'Calbayog',
  'Bacolod',
  'Tacloban',
];
