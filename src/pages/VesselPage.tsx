import { Anchor, Box, Button, Grid, Group, Paper, Select, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { isReserving, vesselNow } from '../data/rules';
import { NOW_COLOR, PageHeader, StatusBadge, mapsLink, showDone, showError } from '../components/common';
import { OwnerNotes } from '../components/PlaybookEntryCard';
import { PORTS, dateRange, dateTime, todayISO } from '../lib/format';
import type { Booking, Vessel, VesselType } from '../types';

function TripList({ items, empty }: { items: Booking[]; empty: string }) {
  const { client } = useLookups();
  if (!items.length) return <Text c="dimmed">{empty}</Text>;
  return (
    <Stack gap={0}>
      {items.map((b) => (
        <Anchor key={b.id} component={Link} to={`/bookings/${b.id}`} c="inherit" underline="never" py={8} style={{ borderTop: '1px solid var(--rv-line)' }}>
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text fw={600}>
                {b.origin} to {b.destination}
              </Text>
              <Text size="sm" c="dimmed">
                {dateRange(b.startDate, b.endDate)}, {client(b.clientId)?.company}
              </Text>
            </div>
            <StatusBadge status={b.status} size="sm" />
          </Group>
        </Anchor>
      ))}
    </Stack>
  );
}

export default function VesselPage() {
  const { id } = useParams();
  const { state, saveVessel } = useStore();
  const vessel = state.vessels.find((v) => v.id === id);
  const [form, setForm] = useState<Vessel | undefined>(vessel);

  if (!vessel || !form) return <PageHeader title="Vessel not found" />;

  const now = vesselNow(vessel, state.bookings);
  const mine = state.bookings.filter((b) => b.vesselIds.includes(vessel.id) && b.status !== 'cancelled');
  const today = todayISO();
  const upcoming = mine.filter((b) => b.endDate >= today && b.status !== 'completed').sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = mine.filter((b) => !upcoming.includes(b)).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastPos = mine
    .flatMap((b) => b.updates)
    .filter((u) => u.position)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  const daysWorked = mine
    .filter((b) => isReserving(b.status))
    .reduce((n, b) => n + (Math.round((Date.parse(b.endDate) - Date.parse(b.startDate)) / 864e5) + 1), 0);

  return (
    <>
      <PageHeader title={vessel.name} sub={`${vessel.type}, ${vessel.capacity}`} />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="lg" mb="lg" style={{ borderLeft: `6px solid ${NOW_COLOR[now.state]}` }}>
            <Text fw={600} size="lg">
              {now.where}
            </Text>
            <Text c="dimmed">{now.next}</Text>
            {lastPos?.position && (
              <Anchor href={mapsLink(lastPos.position)} target="_blank" size="sm" mt="xs" display="inline-block">
                <IconMapPin size={14} style={{ verticalAlign: -2 }} /> Last known position, {dateTime(lastPos.at)}
              </Anchor>
            )}
          </Paper>
          <Paper withBorder p="lg" mb="lg">
            <Title order={2} size="h3" mb="xs">
              Upcoming and current trips
            </Title>
            <TripList items={upcoming} empty="No trips booked. Open Bookings to add one." />
          </Paper>
          <Paper withBorder p="lg">
            <Title order={2} size="h3" mb="xs">
              Past trips
            </Title>
            <Text size="sm" c="dimmed" mb="xs">
              {daysWorked} days booked in total.
            </Text>
            <TripList items={past} empty="No past trips yet." />
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="lg">
            <Title order={2} size="h3" mb="md">
              Details
            </Title>
            <Stack>
              <TextInput label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.currentTarget.value })} />
              <Select
                label="Type"
                data={['LCT', 'Tugboat', 'Barge']}
                value={form.type}
                onChange={(v) => v && setForm({ ...form, type: v as VesselType })}
                allowDeselect={false}
              />
              <TextInput label="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.currentTarget.value })} />
              <Select label="Home port" data={PORTS} value={form.homePort} onChange={(v) => v && setForm({ ...form, homePort: v })} searchable />
              <Textarea label="Notes" autosize minRows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.currentTarget.value })} />
              <Button
                onClick={() => {
                  try {
                    saveVessel(form);
                    showDone('Vessel saved.');
                  } catch (e) {
                    showError(e);
                  }
                }}
              >
                Save vessel
              </Button>
              <Text size="xs" c="dimmed">
                Last changed by {vessel.changedBy}, {dateTime(vessel.changedAt)}
              </Text>
            </Stack>
          </Paper>
          <Box mt="lg">
            <OwnerNotes vesselId={vessel.id} />
          </Box>
        </Grid.Col>
      </Grid>
    </>
  );
}
