// Made-up sample data for the demo. Every company, person and price here is fictional.
// Dates are built relative to today so the demo always looks current.
import dayjs from 'dayjs';
import type { Booking, BookingStatus, Client, DemoState, TripUpdate, User, Vessel } from '../types';
import { addDays, todayISO, trackingCode } from '../lib/format';
import { buildHandover, buildSamplePlaybook } from './continuity';

const STAFF = 'Joy Santos (Office)';

function at(dayOffset: number, hour: number) {
  return dayjs().startOf('day').add(dayOffset, 'day').add(hour, 'hour').toISOString();
}

export function buildSampleData(): DemoState {
  const t = todayISO();
  const d = (n: number) => addDays(t, n);
  const now = new Date().toISOString();

  const vessels: Vessel[] = [
    { id: 'uno', name: 'LCT Rivera Uno', type: 'LCT', capacity: '600 tons', homePort: 'Cebu', notes: 'Fits 8 ten-wheeler trucks.', changedBy: STAFF, changedAt: now },
    { id: 'dos', name: 'LCT Rivera Dos', type: 'LCT', capacity: '450 tons', homePort: 'Cebu', notes: 'Shallow draft, good for small ports.', changedBy: STAFF, changedAt: now },
    { id: 'star', name: 'Tug Rivera Star', type: 'Tugboat', capacity: '1,200 hp', homePort: 'Cebu', notes: 'Usually tows Barge RTS-01.', changedBy: STAFF, changedAt: now },
    { id: 'ace', name: 'Tug Rivera Ace', type: 'Tugboat', capacity: '800 hp', homePort: 'Cebu', notes: 'Usually tows Barge RTS-02.', changedBy: STAFF, changedAt: now },
    { id: 'b01', name: 'Barge RTS-01', type: 'Barge', capacity: '1,000 tons deck cargo', homePort: 'Cebu', notes: '', changedBy: STAFF, changedAt: now },
    { id: 'b02', name: 'Barge RTS-02', type: 'Barge', capacity: '800 tons deck cargo', homePort: 'Cebu', notes: '', changedBy: STAFF, changedAt: now },
  ];

  const users: User[] = [
    { id: 'owner', name: 'Owner', email: 'owner@example.com', role: 'owner' },
    { id: 'staff', name: STAFF, email: 'office@example.com', role: 'staff' },
    { id: 'capt-uno', name: 'Capt. Dante Reyes', email: 'dante@example.com', role: 'captain', vesselId: 'uno' },
    { id: 'capt-dos', name: 'Capt. Arnel Cruz', email: 'arnel@example.com', role: 'captain', vesselId: 'dos' },
    { id: 'capt-star', name: 'Capt. Rey Gomez', email: 'rey@example.com', role: 'captain', vesselId: 'star' },
    { id: 'capt-ace', name: 'Capt. Nonoy Bautista', email: 'nonoy@example.com', role: 'captain', vesselId: 'ace' },
  ];

  const c = (id: string, company: string, contactPerson: string, phone: string, address: string, notes = ''): Client => ({
    id,
    company,
    contactPerson,
    phone,
    email: `${contactPerson.split(' ')[0].toLowerCase()}@${id}.example.com`,
    address,
    notes,
    changedBy: STAFF,
    changedAt: now,
  });
  const clients: Client[] = [
    c('sugbo', 'Sugbo Builders Corp.', 'Ramon Dela Cruz', '0917 000 1201', 'Mandaue City, Cebu', 'Regular. Pays deposit same day.'),
    c('bohol', 'Bohol Island Constructors', 'Liza Mercado', '0918 000 3344', 'Tagbilaran City, Bohol'),
    c('leyte', 'Leyte Power Works', 'Engr. Paolo Lim', '0920 000 7788', 'Ormoc City, Leyte', 'Ships transformers; needs extra lashing.'),
    c('mindanao', 'Mindanao Heavy Haul Inc.', 'Grace Uy', '0915 000 4521', 'Cagayan de Oro City'),
    c('visayan', 'Visayan Agri Supply', 'Jun Villareal', '0927 000 9090', 'Dumaguete City, Negros Oriental'),
    c('masbate', 'Masbate Road Builders', 'Carlo Abad', '0919 000 6262', 'Masbate City'),
  ];

  let refN = 1;
  const upd = (status: BookingStatus, dayOffset: number, hour: number, by: string, extra: Partial<TripUpdate> = {}): TripUpdate => ({
    id: `u${refN}-${status}-${dayOffset}`,
    status,
    by,
    at: at(dayOffset, hour),
    ...extra,
  });
  const b = (
    p: Omit<Booking, 'id' | 'ref' | 'trackingCode' | 'createdAt' | 'changedBy' | 'changedAt' | 'notes' | 'updates'> & {
      notes?: string;
      updates?: TripUpdate[];
    },
  ): Booking => {
    const n = refN++;
    return {
      id: `bk${n}`,
      ref: `RTS-${dayjs().format('YYMM')}-${String(n).padStart(3, '0')}`,
      trackingCode: trackingCode(),
      createdAt: now,
      changedBy: STAFF,
      changedAt: now,
      notes: '',
      updates: [],
      ...p,
    };
  };

  const bookings: Booking[] = [
    b({
      clientId: 'leyte', vesselIds: ['star', 'b01'], origin: 'Cebu', destination: 'Ormoc',
      cargo: '2 power transformers, 85 tons each', startDate: d(-18), endDate: d(-15),
      price: 720000, amountPaid: 720000, status: 'completed',
      updates: [
        upd('confirmed', -25, 10, STAFF), upd('departed', -18, 6, 'Capt. Rey Gomez'),
        upd('arrived', -16, 15, 'Capt. Rey Gomez'), upd('completed', -14, 11, STAFF),
      ],
    }),
    b({
      clientId: 'bohol', vesselIds: ['uno'], origin: 'Cebu', destination: 'Tagbilaran',
      cargo: '6 dump trucks and 1 backhoe', startDate: d(-12), endDate: d(-10),
      price: 260000, amountPaid: 260000, status: 'completed',
      updates: [
        upd('confirmed', -16, 9, STAFF), upd('departed', -12, 5, 'Capt. Dante Reyes'),
        upd('arrived', -11, 13, 'Capt. Dante Reyes'), upd('completed', -9, 10, STAFF),
      ],
    }),
    b({
      clientId: 'masbate', vesselIds: ['dos'], origin: 'Cebu', destination: 'Masbate',
      cargo: 'Asphalt drums', startDate: d(-6), endDate: d(-5),
      price: 190000, amountPaid: 0, status: 'cancelled',
      updates: [upd('quoted', -10, 14, STAFF), upd('cancelled', -8, 9, STAFF, { reason: 'Client cancelled', note: 'Project postponed to next quarter.' })],
    }),
    b({
      clientId: 'mindanao', vesselIds: ['dos'], origin: 'Mandaue', destination: 'Surigao',
      cargo: 'Steel beams, 380 tons', startDate: d(-4), endDate: d(-1),
      price: 340000, amountPaid: 170000, status: 'arrived',
      notes: 'Balance due on delivery.',
      updates: [
        upd('confirmed', -9, 11, STAFF), upd('departed', -4, 6, 'Capt. Arnel Cruz', { position: { lat: 10.33, lng: 123.95 } }),
        upd('arrived', -1, 16, 'Capt. Arnel Cruz', { position: { lat: 9.79, lng: 125.49 } }),
      ],
    }),
    b({
      clientId: 'bohol', vesselIds: ['uno'], origin: 'Cebu', destination: 'Tagbilaran',
      cargo: '4 ten-wheeler trucks and 1 excavator', startDate: d(-1), endDate: d(1),
      price: 280000, amountPaid: 140000, status: 'departed',
      readiness: { state: 'ready', by: 'Capt. Dante Reyes', at: at(-2, 17) },
      updates: [
        upd('confirmed', -7, 10, STAFF),
        upd('departed', -1, 7, 'Capt. Dante Reyes', { position: { lat: 10.29, lng: 123.91 }, note: 'All cargo lashed.' }),
      ],
    }),
    b({
      clientId: 'mindanao', vesselIds: ['ace', 'b02'], origin: 'Cebu', destination: 'Cagayan de Oro',
      cargo: 'Crane parts and 12 containers', startDate: d(-2), endDate: d(0),
      price: 640000, amountPaid: 320000, status: 'delayed',
      readiness: { state: 'ready', by: 'Capt. Nonoy Bautista', at: at(-3, 18) },
      updates: [
        upd('confirmed', -10, 15, STAFF),
        upd('departed', -2, 6, 'Capt. Nonoy Bautista', { position: { lat: 10.29, lng: 123.91 } }),
        upd('delayed', -1, 14, 'Capt. Nonoy Bautista', {
          reason: 'Weather or sea condition',
          note: 'Sheltering off Bohol until the gale warning is lifted',
          position: { lat: 9.62, lng: 123.85 },
        }),
      ],
    }),
    b({
      clientId: 'sugbo', vesselIds: ['ace', 'b02'], origin: 'Cagayan de Oro', destination: 'Cebu',
      cargo: 'Cement, 700 tons bagged', startDate: d(2), endDate: d(4),
      price: 610000, amountPaid: 305000, status: 'confirmed',
      updates: [upd('confirmed', -3, 10, STAFF)],
    }),
    b({
      clientId: 'visayan', vesselIds: ['dos'], origin: 'Cebu', destination: 'Dumaguete',
      cargo: 'Fertilizer, 300 tons', startDate: d(1), endDate: d(2),
      price: 210000, amountPaid: 105000, status: 'confirmed',
      updates: [upd('confirmed', -5, 9, STAFF)],
    }),
    b({
      clientId: 'leyte', vesselIds: ['star', 'b01'], origin: 'Cebu', destination: 'Iloilo',
      cargo: 'Generator set and switchgear', startDate: d(0), endDate: d(3),
      price: 780000, amountPaid: 390000, status: 'confirmed',
      readiness: { state: 'ready', by: 'Capt. Rey Gomez', at: at(-1, 18), note: 'Fuel and water full.' },
      updates: [upd('confirmed', -6, 13, STAFF)],
    }),
    b({
      clientId: 'masbate', vesselIds: ['uno'], origin: 'Tagbilaran', destination: 'Masbate',
      cargo: 'Road roller and 3 graders', startDate: d(3), endDate: d(5),
      price: 300000, amountPaid: 150000, status: 'confirmed',
      updates: [upd('confirmed', -2, 16, STAFF)],
    }),
    b({
      clientId: 'sugbo', vesselIds: ['dos'], origin: 'Cebu', destination: 'Masbate',
      cargo: 'Gravel, 400 tons', startDate: d(6), endDate: d(8),
      price: 255000, amountPaid: 0, status: 'quoted',
      updates: [upd('quoted', -1, 11, STAFF)],
    }),
    b({
      clientId: 'bohol', vesselIds: [], origin: 'Mandaue', destination: 'Ozamiz',
      cargo: 'Prefab steel building, about 500 tons', startDate: d(10), endDate: d(14),
      price: 0, amountPaid: 0, status: 'inquiry',
      notes: 'Asked by phone. Needs a tug and barge.',
      updates: [upd('inquiry', 0, 8, STAFF)],
    }),
    b({
      clientId: 'leyte', vesselIds: ['star', 'b01'], origin: 'Cebu', destination: 'Surigao',
      cargo: 'Transmission towers, 60 pieces', startDate: d(8), endDate: d(11),
      price: 690000, amountPaid: 345000, status: 'confirmed',
      updates: [upd('confirmed', -1, 15, STAFF)],
    }),
    b({
      clientId: 'visayan', vesselIds: ['dos'], origin: 'Mandaue', destination: 'Tacloban',
      cargo: 'Rice, 420 tons', startDate: d(12), endDate: d(14),
      price: 275000, amountPaid: 137500, status: 'confirmed',
      updates: [upd('confirmed', 0, 7, STAFF)],
    }),
  ];

  return { version: 1, seededOn: t, users, vessels, clients, bookings, ...sampleContinuity(now) };
}

/** The Playbook and handover checklist, also used to upgrade demo data saved before they existed. */
export function sampleContinuity(nowIso: string) {
  const handover = buildHandover().map((h) =>
    h.id === 'h-successor'
      ? { ...h, done: true, doneBy: 'Owner', doneAt: nowIso, note: 'His grandson will take over, with Joy Santos running daily operations.' }
      : h,
  );
  return { playbook: buildSamplePlaybook(nowIso), handover };
}
