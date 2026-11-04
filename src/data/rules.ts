// Business rules: statuses, the double-booking check, and what needs attention.
// Kept free of React so the same rules can run against Firestore later.
import type { Booking, BookingStatus, Client, Vessel } from '../types';
import { addDays, daysBetween, relativeDay, shortDate, todayISO } from '../lib/format';

export const STATUS: Record<BookingStatus, { label: string; color: string; hint: string }> = {
  inquiry: { label: 'Inquiry', color: 'gray', hint: 'Client asked; nothing promised yet' },
  quoted: { label: 'Quoted', color: 'grape', hint: 'Price and dates sent to the client' },
  confirmed: { label: 'Confirmed', color: 'harbor', hint: 'Deposit received; vessel reserved' },
  departed: { label: 'Departed', color: 'teal', hint: 'Left port with the cargo' },
  delayed: { label: 'Delayed', color: 'yellow', hint: 'Held up; reason recorded' },
  arrived: { label: 'Arrived', color: 'green', hint: 'Cargo delivered' },
  completed: { label: 'Completed', color: 'gray', hint: 'Balance paid and closed' },
  cancelled: { label: 'Cancelled', color: 'red', hint: 'Called off; reason recorded' },
};

export const STATUS_ORDER: BookingStatus[] = [
  'inquiry',
  'quoted',
  'confirmed',
  'departed',
  'delayed',
  'arrived',
  'completed',
  'cancelled',
];

/** Statuses that hold a vessel's days on the calendar. */
export const RESERVING: BookingStatus[] = ['confirmed', 'departed', 'delayed', 'arrived', 'completed'];
export const isReserving = (s: BookingStatus) => RESERVING.includes(s);
export const isActive = (s: BookingStatus) => s === 'departed' || s === 'delayed';

/** Which status changes are allowed from each status. */
export const NEXT: Record<BookingStatus, BookingStatus[]> = {
  inquiry: ['quoted', 'confirmed', 'cancelled'],
  quoted: ['confirmed', 'cancelled'],
  confirmed: ['departed', 'delayed', 'cancelled'],
  delayed: ['departed', 'arrived', 'cancelled'],
  departed: ['delayed', 'arrived'],
  arrived: ['completed'],
  completed: [],
  cancelled: [],
};

/** Status changes a captain may make from the boat. */
export const CAPTAIN_CAN: BookingStatus[] = ['departed', 'delayed', 'arrived'];

export const NEEDS_REASON: BookingStatus[] = ['delayed', 'cancelled'];

export const DELAY_REASONS = [
  'Weather or sea condition',
  'Waiting for port clearance',
  'Previous job ran late',
  'Engine or equipment problem',
  'Cargo not ready',
  'Crew issue',
  'Other',
];

export const CANCEL_REASONS = [
  'Client cancelled',
  'Vessel unavailable',
  'Price not accepted',
  'Duplicate entry',
  'Other',
];

/** Days between two jobs on the same vessel below which staff get a warning. */
export const BUFFER_DAYS = 1;

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && bStart <= aEnd;

export interface Clash {
  kind: 'blocked' | 'tight';
  vesselId: string;
  other: Booking;
  message: string;
}

/**
 * Checks a booking's dates against every other booking that reserves the same vessels.
 * 'blocked' clashes stop a booking from being confirmed; 'tight' ones only warn.
 */
export function findClashes(
  draft: Pick<Booking, 'id' | 'vesselIds' | 'startDate' | 'endDate'>,
  bookings: Booking[],
  vessels: Vessel[],
  clients: Client[],
): Clash[] {
  if (!draft.startDate || !draft.endDate) return [];
  const out: Clash[] = [];
  for (const other of bookings) {
    if (other.id === draft.id || !isReserving(other.status)) continue;
    for (const vid of draft.vesselIds) {
      if (!other.vesselIds.includes(vid)) continue;
      const vName = vessels.find((v) => v.id === vid)?.name ?? 'This vessel';
      const who = clients.find((c) => c.id === other.clientId)?.company ?? 'another client';
      if (overlaps(draft.startDate, draft.endDate, other.startDate, other.endDate)) {
        out.push({
          kind: 'blocked',
          vesselId: vid,
          other,
          message: `${vName} is already reserved ${shortDate(other.startDate)} to ${shortDate(other.endDate)} for ${who} (${other.ref}).`,
        });
        continue;
      }
      const gapAfterOther = daysBetween(other.endDate, draft.startDate);
      const gapBeforeOther = daysBetween(draft.endDate, other.startDate);
      if (gapAfterOther > 0 && gapAfterOther <= BUFFER_DAYS) {
        out.push({
          kind: 'tight',
          vesselId: vid,
          other,
          message: `${vName} only finishes ${who}'s trip (${other.ref}) on ${shortDate(other.endDate)}, the day before. If that trip runs late, this one is at risk.`,
        });
      } else if (gapBeforeOther > 0 && gapBeforeOther <= BUFFER_DAYS) {
        out.push({
          kind: 'tight',
          vesselId: vid,
          other,
          message: `${vName} starts ${who}'s trip (${other.ref}) on ${shortDate(other.startDate)}, the day after this one ends. If this trip runs late, that one is at risk.`,
        });
      }
    }
  }
  return out;
}

export const balanceDue = (b: Booking) => Math.max(0, b.price - b.amountPaid);

export interface Attention {
  booking: Booking;
  level: 'red' | 'amber';
  title: string;
  detail: string;
}

/** Everything the office should act on today, most urgent first. */
export function needsAttention(bookings: Booking[], vessels: Vessel[]): Attention[] {
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const names = (b: Booking) =>
    b.vesselIds.map((id) => vessels.find((v) => v.id === id)?.name).filter(Boolean).join(' and ') || 'No vessel';
  const is = (b: Booking) => (b.vesselIds.length > 1 ? 'are' : 'is');
  const has = (b: Booking) => (b.vesselIds.length > 1 ? 'have' : 'has');
  const out: Attention[] = [];

  for (const b of bookings) {
    if (b.status === 'confirmed' && b.startDate < today) {
      out.push({
        booking: b,
        level: 'red',
        title: `${names(b)} ${has(b)} not departed`,
        detail: `It was due to leave ${b.origin} ${relativeDay(b.startDate)}. Call the captain and the client.`,
      });
    } else if (b.status === 'confirmed' && (b.startDate === today || b.startDate === tomorrow)) {
      if (b.readiness?.state === 'not_ready') {
        out.push({
          booking: b,
          level: 'red',
          title: `${names(b)} ${is(b)} not ready`,
          detail: `Departs ${relativeDay(b.startDate)} to ${b.destination}. Captain's note: ${b.readiness.note || 'none'}.`,
        });
      } else if (b.readiness?.state !== 'ready') {
        out.push({
          booking: b,
          level: 'red',
          title: `No readiness check for ${names(b)}`,
          detail: `Departs ${relativeDay(b.startDate)} to ${b.destination}. The captain hasn't confirmed the vessel is ready.`,
        });
      }
    }
    if (b.status === 'delayed') {
      const last = [...b.updates].reverse().find((u) => u.status === 'delayed');
      out.push({
        booking: b,
        level: 'amber',
        title: `${names(b)} ${is(b)} delayed`,
        detail: `${b.origin} to ${b.destination}. ${last?.reason ?? 'No reason given'}${last?.note ? `: ${last.note}` : ''}.`,
      });
      for (const later of bookings) {
        if (later.id === b.id || later.status !== 'confirmed') continue;
        const shared = later.vesselIds.some((v) => b.vesselIds.includes(v));
        if (shared && later.startDate >= b.startDate && daysBetween(b.endDate, later.startDate) <= 7) {
          out.push({
            booking: later,
            level: 'red',
            title: `Next trip at risk: ${later.ref}`,
            detail: `Uses the delayed vessel and departs ${relativeDay(later.startDate)}. Call the client early.`,
          });
        }
      }
    }
    if (b.status === 'departed' && b.endDate < today) {
      out.push({
        booking: b,
        level: 'amber',
        title: `${names(b)} ${is(b)} past the arrival date`,
        detail: `Expected in ${b.destination} ${relativeDay(b.endDate)}. Ask the captain for an update.`,
      });
    }
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'red' ? -1 : 1));
}

export interface VesselNow {
  state: 'underway' | 'delayed' | 'loading' | 'in_port';
  where: string;
  next?: string;
  booking?: Booking;
}

/** Where a vessel is right now, in plain words. */
export function vesselNow(vessel: Vessel, bookings: Booking[]): VesselNow {
  const today = todayISO();
  const mine = bookings
    .filter((b) => b.vesselIds.includes(vessel.id) && isReserving(b.status))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const active = mine.find((b) => isActive(b.status));
  const departingToday = mine.find((b) => b.status === 'confirmed' && b.startDate === today);
  const upcoming = mine.find(
    (b) => b.status === 'confirmed' && b.startDate >= today && b !== active && b !== departingToday,
  );
  const nextText = upcoming
    ? `Next: ${upcoming.origin} to ${upcoming.destination}, ${relativeDay(upcoming.startDate)}`
    : 'No trips booked yet';

  if (active) {
    const departed = active.updates.some((u) => u.status === 'departed');
    if (active.status === 'delayed') {
      return {
        state: 'delayed',
        where: departed
          ? `Delayed between ${active.origin} and ${active.destination}`
          : `Delayed at ${active.origin}, bound for ${active.destination}`,
        next: nextText,
        booking: active,
      };
    }
    return {
      state: 'underway',
      where: `Underway ${active.origin} to ${active.destination}, due ${relativeDay(active.endDate)}`,
      next: nextText,
      booking: active,
    };
  }
  if (departingToday) {
    return {
      state: 'loading',
      where: `Loading at ${departingToday.origin}, leaves today for ${departingToday.destination}`,
      next: nextText,
      booking: departingToday,
    };
  }
  const last = [...mine].reverse().find((b) => b.status === 'arrived' || b.status === 'completed');
  return { state: 'in_port', where: `In port at ${last?.destination ?? vessel.homePort}`, next: nextText };
}
