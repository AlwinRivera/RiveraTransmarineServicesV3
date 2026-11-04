import { Anchor, Button, Paper, Table, Text, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { balanceDue } from '../data/rules';
import { PageHeader } from '../components/common';
import { money } from '../lib/format';

export default function ClientsPage() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const rows = state.clients
    .filter((c) => !term || `${c.company} ${c.contactPerson} ${c.address}`.toLowerCase().includes(term))
    .sort((a, b) => a.company.localeCompare(b.company));

  return (
    <>
      <PageHeader
        title="Clients"
        sub={`${state.clients.length} companies`}
        actions={
          <Button component={Link} to="/clients/new" leftSection={<IconPlus size={18} />}>
            Add client
          </Button>
        }
      />
      <TextInput
        placeholder="Search by company, contact or city"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        mb="md"
        maw={420}
        aria-label="Search clients"
      />
      <Paper withBorder>
        <Table.ScrollContainer minWidth={640}>
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Company</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th ta="right">Trips</Table.Th>
                <Table.Th ta="right">Balance due</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((c) => {
                const bookings = state.bookings.filter((b) => b.clientId === c.id && b.status !== 'cancelled');
                const due = bookings.filter((b) => ['arrived', 'completed'].includes(b.status)).reduce((n, b) => n + balanceDue(b), 0);
                return (
                  <Table.Tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${c.id}`)}>
                    <Table.Td>
                      <Anchor component={Link} to={`/clients/${c.id}`} fw={600} c="inherit" onClick={(e) => e.stopPropagation()}>
                        {c.company}
                      </Anchor>
                      <Text size="xs" c="dimmed">
                        {c.address}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {c.contactPerson}
                      <Text size="xs" c="dimmed">
                        {c.phone}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="right" className="rv-num">
                      {bookings.length}
                    </Table.Td>
                    <Table.Td ta="right" className="rv-num" c={due ? 'var(--rv-attention-text)' : undefined}>
                      {due ? money(due) : 'None'}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </>
  );
}
