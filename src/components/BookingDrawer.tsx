import { Button, Drawer, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowsMaximize } from '@tabler/icons-react';
import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { ClientLinkPanel, HistoryPanel, StatusPanel } from '../pages/BookingPage';
import { StatusBadge } from './common';
import { dateRange } from '../lib/format';

/**
 * Lets a screen open bookings in a side panel instead of leaving the page.
 * Links still work normally with Ctrl or middle click.
 */
export function useBookingDrawer() {
  const [id, setId] = useState<string | null>(null);
  const openFromLink = (bookingId: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setId(bookingId);
  };
  const drawer = <BookingDrawer id={id} onClose={() => setId(null)} />;
  return { open: setId, openFromLink, drawer };
}

function BookingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { state } = useStore();
  const { client, vesselNames } = useLookups();
  const narrow = useMediaQuery('(max-width: 48em)');
  const b = id ? state.bookings.find((x) => x.id === id) : undefined;

  return (
    <Drawer
      opened={!!b}
      onClose={onClose}
      position="right"
      size={narrow ? '100%' : 520}
      title={
        b && (
          <Group gap="sm">
            <Text fw={600} size="lg" ff="heading">
              {b.origin} to {b.destination}
            </Text>
            <StatusBadge status={b.status} />
          </Group>
        )
      }
      closeButtonProps={{ 'aria-label': 'Close booking panel' }}
    >
      {b && (
        <Stack gap="md">
          <Stack gap={4}>
            <Text>
              <Text span c="dimmed">
                Dates:{' '}
              </Text>
              {dateRange(b.startDate, b.endDate)}
            </Text>
            <Text>
              <Text span c="dimmed">
                Vessels:{' '}
              </Text>
              {vesselNames(b.vesselIds)}
            </Text>
            <Text>
              <Text span c="dimmed">
                Cargo:{' '}
              </Text>
              {b.cargo || 'Not entered'}
            </Text>
            <Text size="sm" c="dimmed">
              {b.ref}, for {client(b.clientId)?.company}
            </Text>
          </Stack>
          <Button component={Link} to={`/bookings/${b.id}`} variant="default" leftSection={<IconArrowsMaximize size={16} />} onClick={onClose}>
            Open full booking to edit
          </Button>
          <StatusPanel booking={b} />
          <ClientLinkPanel booking={b} />
          <HistoryPanel booking={b} />
        </Stack>
      )}
    </Drawer>
  );
}
