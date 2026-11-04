import {
  Alert,
  Anchor,
  Autocomplete,
  Button,
  CopyButton,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  Timeline,
  Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconAlertTriangle,
  IconBan,
  IconCopy,
  IconExternalLink,
  IconMapPin,
  IconMessage,
  IconPlus,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLookups, useStore, type BookingDraft } from '../data/store';
import {
  CANCEL_REASONS,
  DELAY_REASONS,
  NEEDS_REASON,
  NEXT,
  STATUS,
  balanceDue,
  findClashes,
  isReserving,
} from '../data/rules';
import { PageHeader, StatusBadge, mapsLink, showDone, showError, statusVar } from '../components/common';
import { PORTS, dateRange, dateTime, money, relativeDay } from '../lib/format';
import type { Booking, BookingStatus } from '../types';

type Form = Omit<BookingDraft, 'id'>;

function emptyForm(): Form {
  return {
    clientId: '',
    vesselIds: [],
    origin: 'Cebu',
    destination: '',
    cargo: '',
    startDate: '',
    endDate: '',
    price: 0,
    amountPaid: 0,
    status: 'inquiry',
    notes: '',
  };
}

function fromBooking(b: Booking): Form {
  const { clientId, vesselIds, origin, destination, cargo, startDate, endDate, price, amountPaid, status, notes } = b;
  return { clientId, vesselIds, origin, destination, cargo, startDate, endDate, price, amountPaid, status, notes };
}

/** A fresh form for each booking, so moving between bookings never shows stale values. */
export default function BookingRoute() {
  const { id } = useParams();
  const [params] = useSearchParams();
  return <BookingPage key={id ?? `new-${params.get('copy') ?? ''}-${params.get('client') ?? ''}`} />;
}

function BookingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, saveBooking } = useStore();
  const existing = id ? state.bookings.find((b) => b.id === id) : undefined;
  const copyOf = params.get('copy') ? state.bookings.find((b) => b.id === params.get('copy')) : undefined;

  const [form, setForm] = useState<Form>(() => {
    if (existing) return fromBooking(existing);
    if (copyOf) return { ...fromBooking(copyOf), startDate: '', endDate: '', amountPaid: 0, status: 'inquiry', notes: '' };
    return { ...emptyForm(), clientId: params.get('client') ?? '' };
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (id && !existing) {
    return (
      <>
        <PageHeader title="Booking not found" />
        <Button component={Link} to="/bookings">
          Back to bookings
        </Button>
      </>
    );
  }

  const locked = existing && ['completed', 'cancelled'].includes(existing.status);
  const draftForCheck = { id: existing?.id ?? '', vesselIds: form.vesselIds, startDate: form.startDate, endDate: form.endDate };
  const clashes = findClashes(draftForCheck, state.bookings, state.vessels, state.clients);
  const blocked = clashes.filter((c) => c.kind === 'blocked');
  const tight = clashes.filter((c) => c.kind === 'tight');
  const types = form.vesselIds.map((vid) => state.vessels.find((v) => v.id === vid)?.type);
  const bargeWithoutTug = types.includes('Barge') && !types.includes('Tugboat');
  const missing = !form.clientId ? 'Choose a client.' : !form.destination ? 'Enter where the cargo is going.' : !form.startDate || !form.endDate ? 'Pick the trip dates.' : '';

  const submit = (status: BookingStatus) => {
    try {
      if (missing) throw new Error(missing);
      const saved = saveBooking({ ...form, status, id: existing?.id });
      showDone(existing ? 'Changes saved.' : `Booking ${saved.ref} saved as ${STATUS[status].label}.`);
      if (!existing) navigate(`/bookings/${saved.id}`, { replace: true });
    } catch (e) {
      showError(e);
    }
  };

  const reserving = isReserving(existing?.status ?? form.status);

  return (
    <>
      <PageHeader
        title={existing ? `${existing.origin} to ${existing.destination}` : copyOf ? 'Repeat booking' : 'New booking'}
        sub={
          existing ? (
            <Group gap="xs" component="span">
              <StatusBadge status={existing.status} />
              <span>
                {existing.ref}, {dateRange(existing.startDate, existing.endDate)}
              </span>
            </Group>
          ) : copyOf ? (
            `Copied from ${copyOf.ref}. Pick new dates.`
          ) : (
            'Fill in what the client asked for. Confirm it once the deposit is in.'
          )
        }
        actions={
          existing && (
            <Button variant="default" leftSection={<IconPlus size={16} />} onClick={() => navigate(`/bookings/new?copy=${existing.id}`)}>
              Duplicate
            </Button>
          )
        }
      />

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="lg">
            <Stack gap="md">
              <Select
                label="Client"
                placeholder="Choose a client"
                searchable
                data={state.clients.map((c) => ({ value: c.id, label: c.company }))}
                value={form.clientId || null}
                onChange={(v) => set('clientId', v ?? '')}
                disabled={locked}
                nothingFoundMessage="No client by that name. Add them under Clients first."
              />
              <Group grow align="flex-start">
                <Autocomplete label="From" data={PORTS} value={form.origin} onChange={(v) => set('origin', v)} disabled={locked} />
                <Autocomplete label="To" data={PORTS} value={form.destination} onChange={(v) => set('destination', v)} disabled={locked} />
              </Group>
              <DatePickerInput
                type="range"
                label="Trip dates"
                description="From loading day to arrival day"
                placeholder="Pick start and end dates"
                value={[form.startDate || null, form.endDate || null]}
                onChange={([s, e]) => setForm((f) => ({ ...f, startDate: s ?? '', endDate: e ?? '' }))}
                allowSingleDateInRange
                valueFormat="ddd D MMM YYYY"
                disabled={locked}
              />
              <MultiSelect
                label="Vessels"
                description="A barge trip also needs the tug that tows it."
                placeholder="Choose vessels"
                data={state.vessels.map((v) => ({ value: v.id, label: `${v.name} (${v.type})` }))}
                value={form.vesselIds}
                onChange={(v) => set('vesselIds', v)}
                disabled={locked}
              />

              {blocked.map((c, i) => (
                <Alert key={`b${i}`} color="red" icon={<IconBan size={18} />} title="Double booking">
                  {c.message}{' '}
                  <Anchor component={Link} to={`/bookings/${c.other.id}`}>
                    Open that booking
                  </Anchor>
                </Alert>
              ))}
              {tight.map((c, i) => (
                <Alert key={`t${i}`} color="yellow" icon={<IconAlertTriangle size={18} />} title="Tight schedule">
                  {c.message}
                </Alert>
              ))}
              {bargeWithoutTug && (
                <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>
                  A barge is selected without a tugboat. Add the tug that will tow it.
                </Alert>
              )}

              <Textarea label="Cargo" placeholder="What, how much, any special handling" autosize minRows={2} value={form.cargo} onChange={(e) => set('cargo', e.currentTarget.value)} disabled={locked} />
              <Group grow align="flex-start">
                <NumberInput label="Price" prefix="₱" thousandSeparator="," min={0} value={form.price} onChange={(v) => set('price', Number(v) || 0)} disabled={locked} />
                <NumberInput
                  label="Paid so far"
                  prefix="₱"
                  thousandSeparator=","
                  min={0}
                  value={form.amountPaid}
                  onChange={(v) => set('amountPaid', Number(v) || 0)}
                  description={form.price ? `Balance due: ${money(Math.max(0, form.price - form.amountPaid))}` : undefined}
                  disabled={locked && existing?.status === 'cancelled'}
                />
              </Group>
              <Textarea label="Notes" autosize minRows={2} value={form.notes} onChange={(e) => set('notes', e.currentTarget.value)} disabled={locked && existing?.status === 'cancelled'} />

              {existing ? (
                <Group>
                  <Button onClick={() => submit(existing.status)} disabled={reserving && blocked.length > 0}>
                    Save changes
                  </Button>
                </Group>
              ) : (
                <Stack gap={6}>
                  <Group gap="sm">
                    <Button onClick={() => submit('confirmed')} disabled={blocked.length > 0 || form.vesselIds.length === 0}>
                      Save as Confirmed
                    </Button>
                    <Button variant="default" onClick={() => submit('quoted')}>
                      Save as Quoted
                    </Button>
                    <Button variant="subtle" onClick={() => submit('inquiry')}>
                      Save as Inquiry
                    </Button>
                  </Group>
                  <Text size="sm" c="dimmed">
                    Only Confirmed reserves the vessel. Confirm once the deposit is received.
                  </Text>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

        {existing && (
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <StatusPanel booking={existing} />
              <ClientLinkPanel booking={existing} />
              <HistoryPanel booking={existing} />
            </Stack>
          </Grid.Col>
        )}
      </Grid>
    </>
  );
}

export function StatusPanel({ booking }: { booking: Booking }) {
  const { changeStatus } = useStore();
  const [asking, setAsking] = useState<BookingStatus | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const options = NEXT[booking.status];

  const apply = (status: BookingStatus, extra: { reason?: string; note?: string } = {}) => {
    try {
      changeStatus(booking.id, { status, ...extra });
      showDone(`Marked ${STATUS[status].label}.`);
      setAsking(null);
      setReason(null);
      setNote('');
    } catch (e) {
      showError(e);
    }
  };

  return (
    <Paper withBorder p="lg">
      <Title order={2} size="h3" mb={4}>
        Status
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        {STATUS[booking.status].hint}.
      </Text>

      {booking.status === 'confirmed' && (
        <Alert
          mb="md"
          color={booking.readiness?.state === 'ready' ? 'teal' : 'lifering'}
          title={
            booking.readiness?.state === 'ready'
              ? 'Captain confirmed the vessel is ready'
              : booking.readiness?.state === 'not_ready'
                ? 'Captain says the vessel is not ready'
                : 'Waiting for the captain’s readiness check'
          }
        >
          {booking.readiness
            ? `${booking.readiness.by}, ${dateTime(booking.readiness.at)}${booking.readiness.note ? `. ${booking.readiness.note}` : ''}`
            : `The captain is asked the day before departure (${relativeDay(booking.startDate)}).`}
        </Alert>
      )}

      {options.length ? (
        <Group gap="sm">
          {options.map((s) => (
            <Button
              key={s}
              variant={s === 'cancelled' ? 'subtle' : 'filled'}
              color={s === 'cancelled' ? 'red' : STATUS[s].color}
              onClick={() => (NEEDS_REASON.includes(s) ? setAsking(s) : apply(s))}
            >
              {s === 'departed' && booking.updates.some((u) => u.status === 'departed') ? 'Back underway' : `Mark ${STATUS[s].label}`}
            </Button>
          ))}
        </Group>
      ) : (
        <Text size="sm">This booking is closed.</Text>
      )}

      <Modal opened={!!asking} onClose={() => setAsking(null)} title={asking ? `Mark ${STATUS[asking].label}` : ''} centered>
        <Stack>
          <Select
            label="Reason"
            data={asking === 'cancelled' ? CANCEL_REASONS : DELAY_REASONS}
            value={reason}
            onChange={setReason}
            placeholder="Choose a reason"
          />
          <Textarea label="Note" placeholder="What happened and what's next" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} />
          <Button disabled={!reason} color={asking === 'cancelled' ? 'red' : 'yellow'} onClick={() => asking && apply(asking, { reason: reason ?? undefined, note: note || undefined })}>
            Mark {asking ? STATUS[asking].label : ''}
          </Button>
        </Stack>
      </Modal>
    </Paper>
  );
}

export function ClientLinkPanel({ booking }: { booking: Booking }) {
  const { client } = useLookups();
  const c = client(booking.clientId);
  const link = `${window.location.origin}${window.location.pathname}#/track/${booking.trackingCode}`;
  const message = `Hi ${c?.contactPerson ?? ''}, this is Rivera Transmarine. Your booking ${booking.ref} (${booking.origin} to ${booking.destination}) is ${STATUS[booking.status].label.toLowerCase()}. Track it here: ${link}`;
  const sms = `sms:${(c?.phone ?? '').replace(/\s/g, '')}?body=${encodeURIComponent(message)}`;
  const due = balanceDue(booking);

  return (
    <Paper withBorder p="lg">
      <Title order={2} size="h3" mb={4}>
        Client
      </Title>
      {c && (
        <Text mb="xs">
          <Anchor component={Link} to={`/clients/${c.id}`} fw={600}>
            {c.company}
          </Anchor>
          <br />
          {c.contactPerson}, {c.phone}
        </Text>
      )}
      <Text size="sm" mb="md">
        {booking.price ? (
          <>
            Price {money(booking.price)}, paid {money(booking.amountPaid)},{' '}
            <Text span fw={600} c={due ? 'var(--rv-attention-text)' : 'var(--rv-ok-text)'}>
              {due ? `${money(due)} due` : 'fully paid'}
            </Text>
          </>
        ) : (
          'Not priced yet.'
        )}
      </Text>
      <Text size="sm" c="dimmed" mb="xs">
        The client's private tracking page shows status, dates, ports and updates only. No prices or notes.
      </Text>
      <Group gap="sm">
        <CopyButton value={link}>
          {({ copied, copy }) => (
            <Button variant="default" leftSection={<IconCopy size={16} />} onClick={copy}>
              {copied ? 'Link copied' : 'Copy tracking link'}
            </Button>
          )}
        </CopyButton>
        <Button variant="default" component={Link} to={`/track/${booking.trackingCode}`} target="_blank" leftSection={<IconExternalLink size={16} />}>
          Open
        </Button>
        <Button variant="light" component="a" href={sms} leftSection={<IconMessage size={16} />}>
          Text the client
        </Button>
      </Group>
    </Paper>
  );
}

export function HistoryPanel({ booking }: { booking: Booking }) {
  const items = useMemo(() => [...booking.updates].reverse(), [booking.updates]);
  return (
    <Paper withBorder p="lg">
      <Title order={2} size="h3" mb="md">
        History
      </Title>
      <Timeline bulletSize={14} lineWidth={2}>
        {items.map((u) => (
          <Timeline.Item key={u.id} bullet={<span />} styles={{ itemBullet: { background: statusVar(u.status), borderColor: statusVar(u.status) } }} title={STATUS[u.status].label}>
            <Text size="sm" c="dimmed">
              {u.by}, {dateTime(u.at)}
            </Text>
            {u.reason && <Text size="sm">{u.reason}</Text>}
            {u.note && <Text size="sm">{u.note}</Text>}
            {u.position && (
              <Anchor href={mapsLink(u.position)} target="_blank" size="sm">
                <IconMapPin size={14} style={{ verticalAlign: -2 }} /> Position on Google Maps
              </Anchor>
            )}
          </Timeline.Item>
        ))}
      </Timeline>
      <Text size="xs" c="dimmed" mt="md">
        Last changed by {booking.changedBy}, {dateTime(booking.changedAt)}
      </Text>
    </Paper>
  );
}
