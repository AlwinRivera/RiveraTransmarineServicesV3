// The demo's data store. It keeps everything in this browser only.
// Every change goes through the functions below, which is where Firestore calls will go later.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Booking, BookingStatus, Client, DemoState, HandoverItem, PlaybookEntry, Position, User, Vessel } from '../types';
import { buildSampleData, sampleContinuity } from './sample';
import { NEEDS_REASON, NEXT, findClashes, isReserving } from './rules';
import { addDays, daysBetween, newId, todayISO, trackingCode } from '../lib/format';
import dayjs from 'dayjs';

const STORAGE_KEY = 'rivera-demo-v1';
const USER_KEY = 'rivera-demo-user';

/**
 * Demo only: moves every date forward by the days since the data was created,
 * so the sample trips always look current while keeping the visitor's changes.
 */
function rollForward(s: DemoState): DemoState {
  const today = todayISO();
  const shift = daysBetween(s.seededOn, today);
  if (shift <= 0) return s;
  const ms = shift * 864e5;
  const t = (iso: string) => new Date(Date.parse(iso) + ms).toISOString();
  return {
    ...s,
    seededOn: today,
    bookings: s.bookings.map((b) => ({
      ...b,
      startDate: addDays(b.startDate, shift),
      endDate: addDays(b.endDate, shift),
      readiness: b.readiness && { ...b.readiness, at: t(b.readiness.at) },
      updates: b.updates.map((u) => ({ ...u, at: t(u.at) })),
    })),
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === 1 && Array.isArray(parsed.bookings)) {
        // Demo data saved before the Playbook existed gets the sample Playbook and checklist.
        const upgraded = parsed.playbook && parsed.handover ? parsed : { ...parsed, ...sampleContinuity(new Date().toISOString()) };
        return rollForward(upgraded);
      }
    }
  } catch {
    // Storage blocked or corrupt: fall back to fresh sample data.
  }
  return buildSampleData();
}

function save(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the demo keeps working for this visit.
  }
}

function loadUserId(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export class RuleError extends Error {}

export interface StatusChange {
  status: BookingStatus;
  reason?: string;
  note?: string;
  position?: Position;
}

export type BookingDraft = Omit<
  Booking,
  'id' | 'ref' | 'trackingCode' | 'createdAt' | 'changedBy' | 'changedAt' | 'updates' | 'readiness'
> & { id?: string };

interface Store {
  state: DemoState;
  user: User | null;
  signIn: (userId: string) => void;
  signOut: () => void;
  saveBooking: (draft: BookingDraft) => Booking;
  changeStatus: (bookingId: string, change: StatusChange) => void;
  setReadiness: (bookingId: string, ready: boolean, note?: string) => void;
  saveVessel: (v: Omit<Vessel, 'changedBy' | 'changedAt'>) => void;
  saveClient: (c: Omit<Client, 'id' | 'changedBy' | 'changedAt'> & { id?: string }) => Client;
  savePlaybookEntry: (e: Omit<PlaybookEntry, 'id' | 'createdAt' | 'changedBy' | 'changedAt'> & { id?: string }) => PlaybookEntry;
  setHandoverDone: (id: string, done: boolean, note?: string) => void;
  resetDemo: () => void;
  restore: (data: DemoState) => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(load);
  const [userId, setUserId] = useState<string | null>(loadUserId);

  useEffect(() => save(state), [state]);
  useEffect(() => {
    try {
      if (userId) localStorage.setItem(USER_KEY, userId);
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }, [userId]);

  const user = state.users.find((u) => u.id === userId) ?? null;
  const by = user?.name ?? 'Unknown';

  const assertCanEdit = useCallback(() => {
    if (!user || user.role === 'captain') throw new RuleError('Only the owner and office staff can change bookings.');
  }, [user]);

  const saveBooking = useCallback(
    (draft: BookingDraft): Booking => {
      assertCanEdit();
      const nowIso = new Date().toISOString();
      if (draft.endDate < draft.startDate) throw new RuleError('The end date is before the start date.');
      if (isReserving(draft.status) && draft.vesselIds.length === 0)
        throw new RuleError('Pick at least one vessel before confirming.');
      const blocked = findClashes(
        { id: draft.id ?? '', vesselIds: draft.vesselIds, startDate: draft.startDate, endDate: draft.endDate },
        state.bookings,
        state.vessels,
        state.clients,
      ).filter((c) => c.kind === 'blocked');
      if (isReserving(draft.status) && blocked.length) throw new RuleError(blocked[0].message);

      let result: Booking;
      if (draft.id) {
        const existing = state.bookings.find((b) => b.id === draft.id);
        if (!existing) throw new RuleError('That booking no longer exists.');
        result = { ...existing, ...draft, id: existing.id, changedBy: by, changedAt: nowIso };
        setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === result.id ? result : b)) }));
      } else {
        const n = state.bookings.length + 1;
        result = {
          ...draft,
          id: newId(),
          ref: `RTS-${dayjs().format('YYMM')}-${String(n).padStart(3, '0')}`,
          trackingCode: trackingCode(),
          createdAt: nowIso,
          changedBy: by,
          changedAt: nowIso,
          updates: [{ id: newId(), status: draft.status, by, at: nowIso }],
        };
        setState((s) => ({ ...s, bookings: [...s.bookings, result] }));
      }
      return result;
    },
    [assertCanEdit, by, state],
  );

  const changeStatus = useCallback(
    (bookingId: string, change: StatusChange) => {
      const b = state.bookings.find((x) => x.id === bookingId);
      if (!b || !user) throw new RuleError('That booking no longer exists.');
      if (user.role === 'captain') {
        if (!user.vesselId || !b.vesselIds.includes(user.vesselId))
          throw new RuleError('Captains can only update their own vessel’s trips.');
        if (!['departed', 'delayed', 'arrived'].includes(change.status))
          throw new RuleError('Captains can mark trips Departed, Delayed or Arrived.');
      }
      if (!NEXT[b.status].includes(change.status))
        throw new RuleError(`A ${b.status} booking can't be marked ${change.status}.`);
      if (NEEDS_REASON.includes(change.status) && !change.reason)
        throw new RuleError('Choose a reason first.');
      if (change.status === 'confirmed') {
        if (b.vesselIds.length === 0) throw new RuleError('Pick at least one vessel before confirming.');
        const blocked = findClashes(b, state.bookings, state.vessels, state.clients).filter((c) => c.kind === 'blocked');
        if (blocked.length) throw new RuleError(blocked[0].message);
      }
      const nowIso = new Date().toISOString();
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((x) =>
          x.id === bookingId
            ? {
                ...x,
                status: change.status,
                changedBy: by,
                changedAt: nowIso,
                updates: [...x.updates, { id: newId(), by, at: nowIso, ...change }],
              }
            : x,
        ),
      }));
    },
    [by, state, user],
  );

  const setReadiness = useCallback(
    (bookingId: string, ready: boolean, note?: string) => {
      const nowIso = new Date().toISOString();
      setState((s) => ({
        ...s,
        bookings: s.bookings.map((x) =>
          x.id === bookingId
            ? { ...x, readiness: { state: ready ? 'ready' : 'not_ready', note, by, at: nowIso }, changedBy: by, changedAt: nowIso }
            : x,
        ),
      }));
    },
    [by],
  );

  const saveVessel = useCallback(
    (v: Omit<Vessel, 'changedBy' | 'changedAt'>) => {
      assertCanEdit();
      const rec: Vessel = { ...v, changedBy: by, changedAt: new Date().toISOString() };
      setState((s) => ({
        ...s,
        vessels: s.vessels.some((x) => x.id === v.id) ? s.vessels.map((x) => (x.id === v.id ? rec : x)) : [...s.vessels, rec],
      }));
    },
    [assertCanEdit, by],
  );

  const saveClient = useCallback(
    (c: Omit<Client, 'id' | 'changedBy' | 'changedAt'> & { id?: string }) => {
      assertCanEdit();
      const rec: Client = { ...c, id: c.id ?? newId(), changedBy: by, changedAt: new Date().toISOString() };
      setState((s) => ({
        ...s,
        clients: s.clients.some((x) => x.id === rec.id) ? s.clients.map((x) => (x.id === rec.id ? rec : x)) : [...s.clients, rec],
      }));
      return rec;
    },
    [assertCanEdit, by],
  );

  const savePlaybookEntry = useCallback(
    (e: Omit<PlaybookEntry, 'id' | 'createdAt' | 'changedBy' | 'changedAt'> & { id?: string }) => {
      assertCanEdit();
      if (!e.title.trim() || !e.body.trim()) throw new RuleError('Add a short title and the details.');
      const nowIso = new Date().toISOString();
      const existing = e.id ? state.playbook.find((x) => x.id === e.id) : undefined;
      const rec: PlaybookEntry = {
        ...e,
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? nowIso,
        changedBy: by,
        changedAt: nowIso,
      };
      setState((s) => ({
        ...s,
        playbook: existing ? s.playbook.map((x) => (x.id === rec.id ? rec : x)) : [rec, ...s.playbook],
      }));
      return rec;
    },
    [assertCanEdit, by, state.playbook],
  );

  const setHandoverDone = useCallback(
    (id: string, done: boolean, note?: string) => {
      if (user?.role !== 'owner') throw new RuleError('Only the owner can update the handover checklist.');
      const nowIso = new Date().toISOString();
      setState((s) => ({
        ...s,
        handover: s.handover.map((h: HandoverItem) =>
          h.id === id ? { ...h, done, note: note ?? h.note, doneBy: done ? by : undefined, doneAt: done ? nowIso : undefined } : h,
        ),
      }));
    },
    [by, user],
  );

  const value = useMemo<Store>(
    () => ({
      state,
      user,
      signIn: setUserId,
      signOut: () => setUserId(null),
      saveBooking,
      changeStatus,
      setReadiness,
      saveVessel,
      saveClient,
      savePlaybookEntry,
      setHandoverDone,
      resetDemo: () => setState(buildSampleData()),
      restore: (data) => {
        if (data?.version !== 1 || !Array.isArray(data.bookings)) throw new RuleError('That file is not a Rivera backup.');
        setState(data.playbook && data.handover ? data : { ...data, ...sampleContinuity(new Date().toISOString()) });
      },
    }),
    [state, user, saveBooking, changeStatus, setReadiness, saveVessel, saveClient, savePlaybookEntry, setHandoverDone],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

/** Small lookups used on many screens. */
export function useLookups() {
  const { state } = useStore();
  return useMemo(() => {
    const vessel = (id: string) => state.vessels.find((v) => v.id === id);
    const client = (id: string) => state.clients.find((c) => c.id === id);
    const vesselNames = (ids: string[]) => ids.map((id) => vessel(id)?.name).filter(Boolean).join(' + ') || 'No vessel yet';
    return { vessel, client, vesselNames };
  }, [state.vessels, state.clients]);
}
