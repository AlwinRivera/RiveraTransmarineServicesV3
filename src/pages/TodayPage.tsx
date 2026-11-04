import { Anchor, Button, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { INTERVIEW } from '../data/continuity';
import { balanceDue, needsAttention, vesselNow } from '../data/rules';
import { NOW_COLOR, PageHeader, StatusBadge } from '../components/common';
import { useBookingDrawer } from '../components/BookingDrawer';
import type { MouseEvent } from 'react';
import { longDate, money, relativeDay, todayISO } from '../lib/format';
import type { Booking } from '../types';

function TripLine({ b, onOpen }: { b: Booking; onOpen: (e: MouseEvent) => void }) {
  const { client, vesselNames } = useLookups();
  return (
    <Anchor component={Link} to={`/bookings/${b.id}`} onClick={onOpen} underline="never" c="inherit" display="block">
      <Group justify="space-between" wrap="nowrap" gap="sm" py={8}>
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Text fw={600} truncate>
            {b.origin} to {b.destination}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {vesselNames(b.vesselIds)}, for {client(b.clientId)?.company}
          </Text>
        </Stack>
        <StatusBadge status={b.status} size="sm" />
      </Group>
    </Anchor>
  );
}

export default function TodayPage() {
  const { state, user } = useStore();
  const { client } = useLookups();
  const handoverDone = state.handover.filter((h) => h.done).length;
  const answered = new Set(state.playbook.map((e) => e.questionId).filter(Boolean)).size;
  const today = todayISO();
  const { openFromLink, drawer } = useBookingDrawer();
  const attention = needsAttention(state.bookings, state.vessels);
  const departing = state.bookings.filter((b) => b.status === 'confirmed' && b.startDate === today);
  const arriving = state.bookings.filter(
    (b) => (b.status === 'departed' || b.status === 'delayed') && b.endDate === today,
  );
  const unpaid = state.bookings
    .filter((b) => (b.status === 'arrived' || b.status === 'completed') && balanceDue(b) > 0)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));

  return (
    <>
      <PageHeader
        title="Today"
        sub={longDate(today)}
        actions={
          <Button component={Link} to="/bookings/new" leftSection={<IconPlus size={18} />}>
            New booking
          </Button>
        }
      />

      {attention.length > 0 && (
        <Paper className="attention" p="md" mb="xl">
          <Group gap={8} mb="xs">
            <IconAlertTriangle size={22} color="var(--rv-attention)" />
            <Title order={2} size="h3">
              {attention.length === 1 ? '1 thing needs attention' : `${attention.length} things need attention`}
            </Title>
          </Group>
          <Stack gap={0}>
            {attention.map((a, i) => (
              <Anchor
                key={`${a.booking.id}-${i}`}
                component={Link}
                to={`/bookings/${a.booking.id}`}
                onClick={openFromLink(a.booking.id)}
                underline="never"
                c="inherit"
                py={8}
                style={{ borderTop: i ? '1px solid color-mix(in srgb, var(--rv-attention) 25%, transparent)' : undefined }}
              >
                <Text fw={600} c={a.level === 'red' ? 'var(--rv-attention-text)' : undefined}>
                  {a.title}
                </Text>
                <Text size="sm">{a.detail}</Text>
              </Anchor>
            ))}
          </Stack>
        </Paper>
      )}

      <Title order={2} mb="xs">
        Where every vessel is
      </Title>
      <Paper withBorder mb="xl" style={{ overflow: 'hidden' }}>
        {state.vessels.map((v) => {
          const now = vesselNow(v, state.bookings);
          return (
            <Link key={v.id} to={`/vessels/${v.id}`} className="fleet-row">
              <span className="fleet-dot" style={{ background: NOW_COLOR[now.state] }} aria-hidden />
              <div>
                <Text fw={600} size="lg" lh={1.2}>
                  {v.name}
                </Text>
                <Text size="sm" c="dimmed">
                  {v.type}, {v.capacity}
                </Text>
              </div>
              <div>
                <Text fw={500}>{now.where}</Text>
                <Text size="sm" c="dimmed">
                  {now.next}
                </Text>
              </div>
            </Link>
          );
        })}
      </Paper>

      {user?.role === 'owner' && (
        <Paper withBorder p="md" mb="xl">
          <Title order={2} size="h3" mb={4}>
            Keeping the business running
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            So Rivera Transmarine can carry on without depending on one person.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Anchor component={Link} to="/handover" c="inherit" underline="never">
              <Group justify="space-between" mb={4}>
                <Text fw={600}>Handover plan</Text>
                <Text size="sm" className="rv-num">
                  {handoverDone} of {state.handover.length} steps
                </Text>
              </Group>
              <Progress value={(handoverDone / state.handover.length) * 100} color="teal" aria-label="Handover plan progress" />
            </Anchor>
            <Anchor component={Link} to="/playbook/interview" c="inherit" underline="never">
              <Group justify="space-between" mb={4}>
                <Text fw={600}>Owner interviews</Text>
                <Text size="sm" className="rv-num">
                  {answered} of {INTERVIEW.length} questions
                </Text>
              </Group>
              <Progress value={(answered / INTERVIEW.length) * 100} aria-label="Owner interview progress" />
            </Anchor>
          </SimpleGrid>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper withBorder p="md">
          <Title order={2} size="h3" mb="xs">
            Departing today
          </Title>
          {departing.length ? departing.map((b) => <TripLine key={b.id} b={b} onOpen={openFromLink(b.id)} />) : <Text c="dimmed">No departures today.</Text>}
        </Paper>
        <Paper withBorder p="md">
          <Title order={2} size="h3" mb="xs">
            Due to arrive today
          </Title>
          {arriving.length ? arriving.map((b) => <TripLine key={b.id} b={b} onOpen={openFromLink(b.id)} />) : <Text c="dimmed">No arrivals due today.</Text>}
        </Paper>
        <Paper withBorder p="md">
          <Title order={2} size="h3" mb="xs">
            Unpaid balances
          </Title>
          {unpaid.length ? (
            unpaid.map((b) => (
              <Anchor key={b.id} component={Link} to={`/bookings/${b.id}`} onClick={openFromLink(b.id)} underline="never" c="inherit" display="block">
                <Group justify="space-between" py={8} wrap="nowrap">
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text fw={600} truncate>
                      {client(b.clientId)?.company}
                    </Text>
                    <Text size="sm" c="dimmed">
                      Delivered {relativeDay(b.endDate)}
                    </Text>
                  </Stack>
                  <Text fw={600} className="rv-num" c="var(--rv-attention-text)">
                    {money(balanceDue(b))}
                  </Text>
                </Group>
              </Anchor>
            ))
          ) : (
            <Text c="dimmed">Every delivered trip is paid.</Text>
          )}
        </Paper>
      </SimpleGrid>
      {drawer}
    </>
  );
}
