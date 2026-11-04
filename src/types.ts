// The shapes of every record in the system.
// These match the Firestore collections in the plan, so the demo can switch to Firebase later.

export type Role = 'owner' | 'staff' | 'captain';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  vesselId?: string; // captains only: the vessel they command
}

export type VesselType = 'LCT' | 'Tugboat' | 'Barge';

export interface Vessel {
  id: string;
  name: string;
  type: VesselType;
  capacity: string;
  homePort: string;
  notes: string;
  changedBy: string;
  changedAt: string;
}

export interface Client {
  id: string;
  company: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  changedBy: string;
  changedAt: string;
}

export type BookingStatus =
  | 'inquiry'
  | 'quoted'
  | 'confirmed'
  | 'departed'
  | 'delayed'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export interface Position {
  lat: number;
  lng: number;
}

export interface TripUpdate {
  id: string;
  status: BookingStatus;
  reason?: string;
  note?: string;
  by: string; // user name
  at: string; // ISO date-time
  position?: Position;
}

export interface Readiness {
  state: 'ready' | 'not_ready';
  note?: string;
  by: string;
  at: string;
}

export interface Booking {
  id: string;
  ref: string; // human-friendly number, e.g. RTS-1104-007
  clientId: string;
  vesselIds: string[]; // a barge trip also reserves the tug that tows it
  origin: string;
  destination: string;
  cargo: string;
  startDate: string; // YYYY-MM-DD, Manila calendar date
  endDate: string; // YYYY-MM-DD, inclusive
  price: number; // pesos
  amountPaid: number; // pesos received so far
  status: BookingStatus;
  notes: string;
  readiness?: Readiness;
  updates: TripUpdate[];
  trackingCode: string;
  createdAt: string;
  changedBy: string;
  changedAt: string;
}

export interface DemoState {
  version: 1;
  seededOn: string;
  users: User[];
  vessels: Vessel[];
  clients: Client[];
  bookings: Booking[];
  playbook: PlaybookEntry[];
  handover: HandoverItem[];
}

/** One piece of the owner's know-how, captured so the business can run without him. */
export type PlaybookTopic = 'clients' | 'pricing' | 'vessels' | 'ports' | 'crew' | 'problems' | 'rules' | 'contacts';

export interface PlaybookEntry {
  id: string;
  topic: PlaybookTopic;
  title: string;
  body: string;
  clientId?: string;
  vesselId?: string;
  source: string; // where it came from, e.g. "Interview with the owner, 5 Nov 2026"
  questionId?: string; // the interview question it answers
  createdAt: string;
  changedBy: string;
  changedAt: string;
}

export type HandoverArea = 'Knowledge' | 'People' | 'Legal' | 'Money' | 'Documents';

/** A step that keeps the business running if the owner can no longer lead it. */
export interface HandoverItem {
  id: string;
  area: HandoverArea;
  title: string;
  detail: string;
  done: boolean;
  doneBy?: string;
  doneAt?: string;
  note?: string;
}
