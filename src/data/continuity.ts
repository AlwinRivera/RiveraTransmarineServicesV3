// Business continuity: the owner's know-how (Playbook), the questions used to capture it,
// and the handover checklist. Sample entries are made up, like the rest of the demo data.
import type { HandoverItem, PlaybookEntry, PlaybookTopic } from '../types';

export const TOPICS: Record<PlaybookTopic, { label: string; hint: string }> = {
  clients: { label: 'Clients', hint: 'Who they are, what they care about, how to keep them' },
  pricing: { label: 'Pricing', hint: 'How trips are priced and when to give a discount' },
  vessels: { label: 'Vessels', hint: 'Quirks, limits, repair history, trusted shops' },
  ports: { label: 'Ports and permits', hint: 'How clearances and paperwork actually get done' },
  crew: { label: 'Crew', hint: 'Who to trust with what, and how to keep good people' },
  problems: { label: 'When things go wrong', hint: 'Past problems and what worked' },
  rules: { label: 'House rules', hint: 'What the business never does, and why' },
  contacts: { label: 'Key contacts', hint: 'People to call, and what each one helps with' },
};

export const TOPIC_ORDER: PlaybookTopic[] = ['clients', 'pricing', 'vessels', 'ports', 'crew', 'problems', 'rules', 'contacts'];

export interface InterviewQuestion {
  id: string;
  topic: PlaybookTopic;
  question: string;
  followUp?: string;
}

/** Questions to ask the owner, a few at a time. Each answer becomes a Playbook entry. */
export const INTERVIEW: InterviewQuestion[] = [
  { id: 'q-start', topic: 'rules', question: 'How did the business start, and what do you want it to be known for?' },
  { id: 'q-never', topic: 'rules', question: 'What will you never do in this business, even for good money?', followUp: 'Has that ever cost you a job?' },
  { id: 'q-best-clients', topic: 'clients', question: 'Who are the clients we must never lose, and why?', followUp: 'What does each one care about most?' },
  { id: 'q-difficult', topic: 'clients', question: 'Which clients are difficult, and how do you handle them?' },
  { id: 'q-new-client', topic: 'clients', question: 'When a new client calls, how do you decide whether to take the job?' },
  { id: 'q-price', topic: 'pricing', question: 'Walk me through how you price a trip, from the first call to the final number.', followUp: 'What changes the price the most: distance, cargo, fuel, season?' },
  { id: 'q-discount', topic: 'pricing', question: 'When do you give a discount, and when do you refuse?' },
  { id: 'q-deposit', topic: 'pricing', question: 'What do you do when a client pays late or asks to pay after the trip?' },
  { id: 'q-vessel-quirks', topic: 'vessels', question: 'For each vessel: what is it good at, what are its limits, and what tends to break?' },
  { id: 'q-repairs', topic: 'vessels', question: 'Which repair shops and suppliers do you trust, and which do you avoid?' },
  { id: 'q-clearance', topic: 'ports', question: 'How does a departure clearance actually get done? Who do you call, and what do they need?' },
  { id: 'q-permits', topic: 'ports', question: 'Which certificates and permits keep the vessels sailing, and when do they renew?' },
  { id: 'q-captains', topic: 'crew', question: 'Which captains and crew do you trust most, and with what kind of trip?' },
  { id: 'q-hiring', topic: 'crew', question: 'How do you hire, and what makes you let someone go?' },
  { id: 'q-worst', topic: 'problems', question: 'Tell me about the worst trip you ever had. What happened and what did you do?' },
  { id: 'q-noshow', topic: 'problems', question: 'What happened with the vessel that didn’t show up, and what should we do differently?' },
  { id: 'q-weather', topic: 'problems', question: 'How do you decide whether to sail when the weather is bad?' },
  { id: 'q-contacts', topic: 'contacts', question: 'If you couldn’t answer the phone for a month, who are the ten people I would need to call?' },
  { id: 'q-bank', topic: 'contacts', question: 'Who handles the bank, the taxes, and the insurance, and how do I reach them?' },
  { id: 'q-advice', topic: 'rules', question: 'What advice would you give the person running this business after you?' },
];

export function buildSamplePlaybook(nowIso: string): PlaybookEntry[] {
  const src = 'Sample entry for the demo';
  const e = (id: string, topic: PlaybookTopic, title: string, body: string, extra: Partial<PlaybookEntry> = {}): PlaybookEntry => ({
    id,
    topic,
    title,
    body,
    source: src,
    createdAt: nowIso,
    changedBy: 'Owner',
    changedAt: nowIso,
    ...extra,
  });
  return [
    e('pb-leyte', 'clients', 'Leyte Power Works ships transformers', 'Always add extra lashing and do a second check before leaving port. Engr. Lim wants a photo of the cargo once it is secured. They pay on time and book every quarter, so give them first choice of dates.', { clientId: 'leyte' }),
    e('pb-mindanao', 'clients', 'Mindanao Heavy Haul pays late but always pays', 'Ask for the 50% deposit before confirming, no exceptions. The balance usually comes 2 to 3 weeks after delivery. Call Grace directly, not the accounting office.', { clientId: 'mindanao' }),
    e('pb-tug-barge', 'pricing', 'Tug and barge trips are priced by the day', 'Count the days from leaving port to returning to Cebu, not just the loaded leg. Add fuel separately when the route is longer than two days. Never quote the same day; check fuel prices first.'),
    e('pb-ace', 'vessels', 'Tug Rivera Ace runs hot on long tows', 'Keep long tows under 30 hours or plan a stop. The cooling system was last overhauled two years ago; ask the shop to check it before the rainy season.', { vesselId: 'ace' }),
    e('pb-dos', 'vessels', 'LCT Rivera Dos is the one for small ports', 'Shallow draft, so it fits ports the big LCT can’t. Do not load over 420 tons even though it is rated 450; it handles badly in waves when full.', { vesselId: 'dos' }),
    e('pb-weather', 'problems', 'When the weather looks bad, the captain decides', 'If the captain says no, we don’t sail, even if the client is angry. Call the client the night before, not the morning of. Losing a day is cheaper than losing a vessel.'),
    e('pb-never', 'rules', 'Never overload, never hide a delay', 'We have kept clients for twenty years because we tell them the truth early. If a trip will be late, the client hears it from us first.'),
  ];
}

export function buildHandover(): HandoverItem[] {
  const h = (id: string, area: HandoverItem['area'], title: string, detail: string): HandoverItem => ({ id, area, title, detail, done: false });
  return [
    h('h-record', 'Knowledge', 'Record interview sessions with the owner', 'Use Interview mode. Aim for one session a week until every question is answered.'),
    h('h-review', 'Knowledge', 'Have the owner review the Playbook', 'He reads each entry and corrects anything that is wrong or missing.'),
    h('h-successor', 'People', 'Agree who will run the business next', 'Name one person, plus a backup. Everyone in the office should know.'),
    h('h-shadow', 'People', 'Successor works alongside the owner', 'Sit in on bookings, quotes, payments and problems for at least three months.'),
    h('h-intro', 'People', 'Introduce the successor to key people', 'Regular clients, captains, port contacts, repair shops, the bank and the accountant.'),
    h('h-structure', 'Legal', 'Check how the business is registered', 'Find the DTI, SEC and BIR certificates. A sole proprietorship legally ends when the owner dies.'),
    h('h-lawyer', 'Legal', 'Meet a lawyer about continuity', 'Ask about a will, converting to a corporation (including a One Person Corporation with a nominee), and vessel ownership.'),
    h('h-will', 'Legal', 'Owner makes a will', 'Prepared with the lawyer, so the vessels and business pass the way he intends.'),
    h('h-signatories', 'Money', 'Add a second authorized bank signatory', 'So payroll, fuel and port fees can still be paid if the owner can’t sign.'),
    h('h-accountant', 'Money', 'Meet the accountant about taxes and estate', 'Understand what is owed every month and what happens to the business taxes later.'),
    h('h-insurance', 'Money', 'Review insurance for vessels and cargo', 'Confirm what is covered, the renewal dates, and who to call to claim.'),
    h('h-vault', 'Documents', 'Collect vessel papers in one safe place', 'Registrations, certificates, permits and insurance, scanned to the shared Google Drive folder.'),
    h('h-logins', 'Documents', 'Write down every account and password', 'Email, bank, government portals and this system, kept in a password manager the successor can open.'),
    h('h-contacts', 'Documents', 'Build the key contacts list', 'Every person from the "ten people to call" question, with what each one helps with.'),
  ];
}
