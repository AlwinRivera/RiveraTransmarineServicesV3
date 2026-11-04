import { Badge, Box, Button, Container, Group, Modal, Paper, Select, Stack, Text, Textarea, Title } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';
import { IconAnchor, IconCheck, IconCloudCheck, IconWifiOff, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { DisplayMenu } from '../components/DisplayMenu';
import { useNavigate } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { DELAY_REASONS, STATUS, isActive } from '../data/rules';
import { StatusBadge, getPosition, showError } from '../components/common';
import { DemoBanner } from '../components/Layout';
import { addDays, dateRange, relativeDay, todayISO } from '../lib/format';
import type { Booking, BookingStatus } from '../types';

/** Joins short facts into sentences without doubling the full stop after names like "Inc.". */
const sentences = (...parts: (string | undefined)[]) =>
  parts
    .filter(Boolean)
    .map((t) => (t!.endsWith('.') ? t : `${t}.`))
    .join(' ');

export default function CaptainPage() {
  const { state, user, signOut, changeStatus, setReadiness } = useStore();
  const { client, vesselNames } = useLookups();
  const navigate = useNavigate();
  const { online } = useNetwork();
  const [busy, setBusy] = useState<string | null>(null);
  const [delayFor, setDelayFor] = useState<Booking | null>(null);
  const [notReadyFor, setNotReadyFor] = useState<Booking | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  // Updates made with no signal. With Firestore these are the writes still waiting to upload.
  const [waiting, setWaiting] = useState(0);
  const wasOnline = useRef(online);

  useEffect(() => {
    if (online && !wasOnline.current && waiting > 0) {
      notifications.clean();
      notifications.show({
        color: 'teal',
        icon: <IconCloudCheck size={18} />,
        message: `Signal is back. ${waiting === 1 ? '1 update' : `${waiting} updates`} sent to the office.`,
      });
      setWaiting(0);
    }
    wasOnline.current = online;
  }, [online, waiting]);

  /** Tells the captain plainly whether the office has it yet. */
  const confirmSent = (what: string) => {
    if (online) {
      notifications.show({ color: 'teal', icon: <IconCloudCheck size={18} />, message: `${what} Sent to the office.` });
    } else {
      setWaiting((n) => n + 1);
      notifications.show({ color: 'yellow', icon: <IconWifiOff size={18} />, message: `${what} Saved on this phone. It will send when signal returns.` });
    }
  };

  const vessel = state.vessels.find((v) => v.id === user?.vesselId);
  const today = todayISO();
  const tomorrow = addDays(today, 1);
  const mine = state.bookings
    .filter((b) => vessel && b.vesselIds.includes(vessel.id))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const current = mine.filter((b) => isActive(b.status));
  const upcoming = mine.filter((b) => b.status === 'confirmed');
  const askReady = upcoming.filter((b) => (b.startDate === today || b.startDate === tomorrow) && b.readiness?.state !== 'ready');
  const recent = mine.filter((b) => b.status === 'arrived' || b.status === 'completed').slice(-3).reverse();

  const update = async (b: Booking, status: BookingStatus, extra: { reason?: string; note?: string } = {}) => {
    setBusy(b.id + status);
    const position = await getPosition();
    try {
      changeStatus(b.id, { status, position, ...extra });
      confirmSent(`${STATUS[status].label}${position ? ', with your position' : ''}.`);
      setDelayFor(null);
      setReason(null);
      setNote('');
    } catch (e) {
      showError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Box mih="100vh">
      <Box component="header">
      <DemoBanner />
      <Box bg="harbor.9" c="white" px="md" py="sm">
        <Group justify="space-between" wrap="nowrap">
          <Group gap={8} wrap="nowrap">
            <IconAnchor size={24} aria-hidden />
            <div>
              <Title order={1} size="h4" lh={1.2} c="white">
                {vessel?.name ?? 'No vessel assigned'}
              </Title>
              <Text size="sm" opacity={0.8} lh={1.2}>
                {user?.name}
              </Text>
            </div>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <DisplayMenu showSun variant="white" />
            <Button
              variant="white"
              size="compact-sm"
              onClick={() => {
                signOut();
                navigate('/login');
              }}
            >
              Switch view
            </Button>
          </Group>
        </Group>
      </Box>
      <Group
        gap={8}
        px="md"
        py={8}
        wrap="nowrap"
        role="status"
        className={online ? 'signal signal-ok' : 'signal signal-wait'}
      >
        {online ? <IconCloudCheck size={20} aria-hidden /> : <IconWifiOff size={20} aria-hidden />}
        <Text size="sm" fw={600}>
          {online
            ? 'Connected. Updates reach the office right away.'
            : waiting
              ? `No signal. ${waiting === 1 ? '1 update' : `${waiting} updates`} saved on this phone, waiting to send.`
              : 'No signal. Updates will be saved on this phone and sent later.'}
        </Text>
      </Group>
      </Box>

      <Container component="main" size={560} py="md">
        {askReady.map((b) => (
          <Paper key={`r${b.id}`} p="md" mb="md" className="attention">
            <Title order={2} size="h3" mb={4}>
              Is {vessel?.name} ready?
            </Title>
            <Text mb="md">
              Leaving {b.origin} {relativeDay(b.startDate)} for {b.destination}. Cargo: {b.cargo}.
              {b.readiness?.state === 'not_ready' && ' You said not ready. Tap Ready once it is.'}
            </Text>
            <Stack gap="sm">
              <Button
                className="captain-btn"
                color="teal"
                leftSection={<IconCheck size={22} />}
                onClick={() => {
                  setReadiness(b.id, true);
                  confirmSent('Ready.');
                }}
              >
                Ready
              </Button>
              <Button className="captain-btn" variant="outline" color="red" leftSection={<IconX size={22} />} onClick={() => setNotReadyFor(b)}>
                Not ready
              </Button>
            </Stack>
          </Paper>
        ))}

        <Title order={2} size="h3" mt="lg" mb="xs">
          Current trip
        </Title>
        {current.length === 0 && <Text c="dimmed">You are not on a trip right now.</Text>}
        {current.map((b) => (
          <Paper key={b.id} withBorder p="md" mb="md">
            <Group justify="space-between" mb={4}>
              <Text fw={600} size="xl">
                {b.origin} to {b.destination}
              </Text>
              <StatusBadge status={b.status} />
            </Group>
            <Text c="dimmed" mb="md">
              {sentences(`Due ${relativeDay(b.endDate)}`, client(b.clientId)?.company, b.cargo)}
            </Text>
            <Stack gap="sm">
              {b.status === 'delayed' && (
                <Button className="captain-btn" color="teal" loading={busy === b.id + 'departed'} onClick={() => update(b, 'departed')}>
                  {b.updates.some((u) => u.status === 'departed') ? 'Back underway' : `Departed from ${b.origin}`}
                </Button>
              )}
              {b.updates.some((u) => u.status === 'departed') && (
                <Button className="captain-btn" color="green" loading={busy === b.id + 'arrived'} onClick={() => update(b, 'arrived')}>
                  Arrived at {b.destination}
                </Button>
              )}
              {b.status === 'departed' && (
                <Button className="captain-btn" variant="outline" color="yellow.8" onClick={() => setDelayFor(b)}>
                  Report a delay
                </Button>
              )}
            </Stack>
          </Paper>
        ))}

        <Title order={2} size="h3" mt="lg" mb="xs">
          Next trips
        </Title>
        {upcoming.length === 0 && <Text c="dimmed">No trips booked.</Text>}
        {upcoming.map((b) => {
          const canLeave = b.startDate <= today;
          return (
            <Paper key={b.id} withBorder p="md" mb="md">
              <Group justify="space-between" mb={4} wrap="nowrap">
                <Text fw={600} size="lg">
                  {b.origin} to {b.destination}
                </Text>
                {b.readiness?.state === 'ready' && <Badge color="teal">Ready</Badge>}
              </Group>
              <Text c="dimmed" mb={canLeave ? 'md' : 0}>
                {sentences(
                  dateRange(b.startDate, b.endDate),
                  client(b.clientId)?.company,
                  b.cargo,
                  b.vesselIds.length > 1 ? `With ${vesselNames(b.vesselIds.filter((v) => v !== vessel?.id))}` : undefined,
                )}
              </Text>
              {canLeave && (
                <Stack gap="sm">
                  <Button className="captain-btn" color="teal" loading={busy === b.id + 'departed'} onClick={() => update(b, 'departed')}>
                    Departed from {b.origin}
                  </Button>
                  <Button className="captain-btn" variant="outline" color="yellow.8" onClick={() => setDelayFor(b)}>
                    Report a delay
                  </Button>
                </Stack>
              )}
            </Paper>
          );
        })}

        {recent.length > 0 && (
          <>
            <Title order={2} size="h3" mt="lg" mb="xs">
              Recent trips
            </Title>
            {recent.map((b) => (
              <Group key={b.id} justify="space-between" py={6} style={{ borderTop: '1px solid var(--rv-line)' }}>
                <Text>
                  {b.origin} to {b.destination}
                </Text>
                <Text size="sm" c="dimmed">
                  {dateRange(b.startDate, b.endDate)}
                </Text>
              </Group>
            ))}
          </>
        )}
      </Container>

      <Modal opened={!!delayFor} onClose={() => setDelayFor(null)} title="Report a delay" centered>
        <Stack>
          <Select label="Reason" data={DELAY_REASONS} value={reason} onChange={setReason} placeholder="Choose a reason" size="md" />
          <Textarea label="What's happening" placeholder="For example: waiting for the gale warning to lift" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} size="md" />
          <Button
            className="captain-btn"
            color="yellow.8"
            disabled={!reason}
            loading={!!delayFor && busy === delayFor.id + 'delayed'}
            onClick={() => delayFor && update(delayFor, 'delayed', { reason: reason ?? undefined, note: note || undefined })}
          >
            Send delay
          </Button>
        </Stack>
      </Modal>

      <Modal opened={!!notReadyFor} onClose={() => setNotReadyFor(null)} title="Not ready" centered>
        <Stack>
          <Textarea label="What's the problem?" placeholder="For example: waiting for a spare part" value={note} onChange={(e) => setNote(e.currentTarget.value)} autosize minRows={2} size="md" />
          <Button
            className="captain-btn"
            color="red"
            onClick={() => {
              if (notReadyFor) setReadiness(notReadyFor.id, false, note || undefined);
              setNotReadyFor(null);
              setNote('');
              confirmSent('Not ready.');
            }}
          >
            Tell the office
          </Button>
        </Stack>
      </Modal>
    </Box>
  );
}
