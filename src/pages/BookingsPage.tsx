import { Anchor, Button, Group, Pagination, Paper, Select, Table, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { STATUS, STATUS_ORDER, balanceDue } from '../data/rules';
import { PageHeader, StatusBadge } from '../components/common';
import { useBookingDrawer } from '../components/BookingDrawer';
import { dateRange, money } from '../lib/format';

const PAGE = 20;

export default function BookingsPage() {
  const { state } = useStore();
  const { client, vesselNames } = useLookups();
  const { open, openFromLink, drawer } = useBookingDrawer();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string | null>('open');
  const [vessel, setVessel] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.bookings
      .filter((b) => {
        if (status === 'open' && ['completed', 'cancelled'].includes(b.status)) return false;
        if (status && status !== 'open' && status !== 'all' && b.status !== status) return false;
        if (vessel && !b.vesselIds.includes(vessel)) return false;
        if (!term) return true;
        const hay = [b.ref, b.origin, b.destination, b.cargo, client(b.clientId)?.company, vesselNames(b.vesselIds)]
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [state.bookings, q, status, vessel, client, vesselNames]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice((page - 1) * PAGE, page * PAGE);

  return (
    <>
      <PageHeader
        title="Bookings"
        sub={`${rows.length} shown`}
        actions={
          <Button component={Link} to="/bookings/new" leftSection={<IconPlus size={18} />}>
            New booking
          </Button>
        }
      />

      <Group mb="md" gap="sm" align="flex-end" wrap="wrap">
        <TextInput
          label="Search"
          placeholder="Client, port, cargo or booking number"
          leftSection={<IconSearch size={16} />}
          value={q}
          onChange={(e) => {
            setQ(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: '1 1 260px' }}
        />
        <Select
          label="Status"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          data={[
            { value: 'open', label: 'Open bookings' },
            { value: 'all', label: 'All bookings' },
            ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label })),
          ]}
          allowDeselect={false}
          w={180}
        />
        <Select
          label="Vessel"
          placeholder="All vessels"
          clearable
          value={vessel}
          onChange={(v) => {
            setVessel(v);
            setPage(1);
          }}
          data={state.vessels.map((v) => ({ value: v.id, label: v.name }))}
          w={200}
        />
      </Group>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={820}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Dates</Table.Th>
                <Table.Th>Client</Table.Th>
                <Table.Th>Route</Table.Th>
                <Table.Th>Vessels</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Balance due</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.map((b) => (
                <Table.Tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => open(b.id)}>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={`/bookings/${b.id}`}
                      fw={600}
                      c="inherit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFromLink(b.id)(e);
                      }}
                    >
                      {dateRange(b.startDate, b.endDate)}
                    </Anchor>
                    <Text size="xs" c="dimmed">
                      {b.ref}
                    </Text>
                  </Table.Td>
                  <Table.Td>{client(b.clientId)?.company}</Table.Td>
                  <Table.Td>
                    {b.origin} to {b.destination}
                  </Table.Td>
                  <Table.Td>{vesselNames(b.vesselIds)}</Table.Td>
                  <Table.Td>
                    <StatusBadge status={b.status} size="sm" />
                  </Table.Td>
                  <Table.Td ta="right" className="rv-num">
                    {b.price ? money(balanceDue(b)) : 'Not priced'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {rows.length === 0 && (
          <Text c="dimmed" p="lg" ta="center">
            No bookings match. Clear the search or pick a different status.
          </Text>
        )}
      </Paper>
      {pages > 1 && <Pagination total={pages} value={page} onChange={setPage} mt="md" />}
      {drawer}
    </>
  );
}
