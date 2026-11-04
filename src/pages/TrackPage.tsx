import { Anchor, Box, Container, Group, Paper, Stack, Text, Timeline, Title } from '@mantine/core';
import { IconAnchor, IconPhone } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { STATUS } from '../data/rules';
import { StatusBadge, statusVar } from '../components/common';
import { DemoBanner } from '../components/Layout';
import { dateRange, dateTime, relativeDay } from '../lib/format';

/**
 * The client's private tracking page. It shows only what the client should see:
 * status, dates, ports and updates. No prices, notes or costs.
 */
export default function TrackPage() {
  const { code } = useParams();
  const { state } = useStore();
  const b = state.bookings.find((x) => x.trackingCode === code);
  const vesselNames = b?.vesselIds.map((id) => state.vessels.find((v) => v.id === id)?.name).filter(Boolean).join(' and ');

  const headline = !b
    ? ''
    : {
        inquiry: 'We received your request',
        quoted: 'Your quotation is ready',
        confirmed: `Departing ${relativeDay(b.startDate)} from ${b.origin}`,
        departed: `On the way to ${b.destination}, due ${relativeDay(b.endDate)}`,
        delayed: 'Your trip is delayed',
        arrived: `Arrived in ${b.destination}`,
        completed: 'Trip completed',
        cancelled: 'This booking was cancelled',
      }[b.status];

  return (
    <Box mih="100vh">
      <Box component="header">
      <DemoBanner />
      <Box bg="harbor.9" c="white" px="md" py="md">
        <Container size={560} p={0}>
          <Group gap={8}>
            <IconAnchor size={24} />
            <Text fw={600} size="lg">
              Rivera Transmarine Services
            </Text>
          </Group>
        </Container>
      </Box>
      </Box>
      <Container component="main" size={560} py="lg">
        {!b ? (
          <Paper withBorder p="lg">
            <Title order={1} size="h2" mb="xs">
              Booking not found
            </Title>
            <Text>Check that you opened the full link from your message, or call the office.</Text>
          </Paper>
        ) : (
          <Stack gap="lg">
            <div>
              <Text c="dimmed">Booking {b.ref}</Text>
              <Title order={1} size="h2" mb="xs">
                {headline}
              </Title>
              <StatusBadge status={b.status} size="lg" />
            </div>
            <Paper withBorder p="lg">
              <Stack gap={6}>
                <Text>
                  <Text span c="dimmed">
                    Route:{' '}
                  </Text>
                  {b.origin} to {b.destination}
                </Text>
                <Text>
                  <Text span c="dimmed">
                    Dates:{' '}
                  </Text>
                  {dateRange(b.startDate, b.endDate)}
                </Text>
                {vesselNames && (
                  <Text>
                    <Text span c="dimmed">
                      Vessel:{' '}
                    </Text>
                    {vesselNames}
                  </Text>
                )}
                <Text>
                  <Text span c="dimmed">
                    Cargo:{' '}
                  </Text>
                  {b.cargo}
                </Text>
              </Stack>
            </Paper>
            <Paper withBorder p="lg">
              <Title order={2} size="h3" mb="md">
                Updates
              </Title>
              <Timeline bulletSize={14} lineWidth={2}>
                {[...b.updates].reverse().map((u) => (
                  <Timeline.Item
                    key={u.id}
                    bullet={<span />}
                    styles={{ itemBullet: { background: statusVar(u.status), borderColor: statusVar(u.status) } }}
                    title={STATUS[u.status].label}
                  >
                    <Text size="sm" c="dimmed">
                      {dateTime(u.at)}
                    </Text>
                    {u.status === 'delayed' && u.reason && <Text size="sm">{u.reason}</Text>}
                    {u.status === 'delayed' && u.note && <Text size="sm">{u.note}</Text>}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Paper>
            <Text size="sm" c="dimmed">
              Questions about this trip?{' '}
              <Anchor href="tel:0322310296" underline="always">
                <IconPhone size={14} style={{ verticalAlign: -2 }} /> Call the office
              </Anchor>
            </Text>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
