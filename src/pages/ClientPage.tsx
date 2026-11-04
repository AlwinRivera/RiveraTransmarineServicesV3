import { Anchor, Box, Button, Grid, Group, Paper, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../data/store';
import { balanceDue } from '../data/rules';
import { PageHeader, StatusBadge, showDone, showError } from '../components/common';
import { OwnerNotes } from '../components/PlaybookEntryCard';
import { dateRange, dateTime, money } from '../lib/format';

const BLANK = { company: '', contactPerson: '', phone: '', email: '', address: '', notes: '' };

export default function ClientPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { state, saveClient } = useStore();
  const existing = isNew ? undefined : state.clients.find((c) => c.id === id);
  const [form, setForm] = useState(() =>
    existing
      ? { company: existing.company, contactPerson: existing.contactPerson, phone: existing.phone, email: existing.email, address: existing.address, notes: existing.notes }
      : BLANK,
  );
  const set = (k: keyof typeof BLANK, v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!isNew && !existing) return <PageHeader title="Client not found" />;

  const bookings = existing
    ? state.bookings.filter((b) => b.clientId === existing.id).sort((a, b) => b.startDate.localeCompare(a.startDate))
    : [];
  const billed = bookings.filter((b) => b.status !== 'cancelled' && b.status !== 'inquiry').reduce((n, b) => n + b.price, 0);
  const due = bookings.filter((b) => ['arrived', 'completed'].includes(b.status)).reduce((n, b) => n + balanceDue(b), 0);

  const submit = () => {
    try {
      if (!form.company.trim()) throw new Error('Enter the company or person name.');
      const saved = saveClient({ ...form, id: existing?.id });
      showDone('Client saved.');
      if (isNew) navigate(`/clients/${saved.id}`, { replace: true });
    } catch (e) {
      showError(e);
    }
  };

  return (
    <>
      <PageHeader
        title={existing?.company ?? 'Add client'}
        sub={existing ? `${bookings.length} bookings, ${money(billed)} in quoted and confirmed work` : 'Companies and people who book trips'}
      />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="lg">
            <Stack>
              <TextInput label="Company" required value={form.company} onChange={(e) => set('company', e.currentTarget.value)} />
              <TextInput label="Contact person" value={form.contactPerson} onChange={(e) => set('contactPerson', e.currentTarget.value)} />
              <Group grow>
                <TextInput label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.currentTarget.value)} />
                <TextInput label="Email" type="email" value={form.email} onChange={(e) => set('email', e.currentTarget.value)} />
              </Group>
              <TextInput label="Address" value={form.address} onChange={(e) => set('address', e.currentTarget.value)} />
              <Textarea label="Notes" autosize minRows={2} value={form.notes} onChange={(e) => set('notes', e.currentTarget.value)} />
              <Button onClick={submit}>{isNew ? 'Add client' : 'Save client'}</Button>
              {existing && (
                <Text size="xs" c="dimmed">
                  Last changed by {existing.changedBy}, {dateTime(existing.changedAt)}
                </Text>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
        {existing && (
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper withBorder p="lg">
              <Group justify="space-between" mb="xs">
                <Title order={2} size="h3">
                  Bookings
                </Title>
                <Text fw={600} c={due ? 'var(--rv-attention-text)' : 'dimmed'} className="rv-num">
                  {due ? `${money(due)} unpaid` : 'Nothing unpaid'}
                </Text>
              </Group>
              {bookings.length === 0 && <Text c="dimmed">No bookings yet.</Text>}
              {bookings.map((b) => (
                <Anchor key={b.id} component={Link} to={`/bookings/${b.id}`} c="inherit" underline="never" display="block" py={8} style={{ borderTop: '1px solid var(--rv-line)' }}>
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Text fw={600}>
                        {b.origin} to {b.destination}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {dateRange(b.startDate, b.endDate)}, {b.ref}
                      </Text>
                    </div>
                    <StatusBadge status={b.status} size="sm" />
                  </Group>
                </Anchor>
              ))}
              <Button component={Link} to={`/bookings/new?client=${existing.id}`} variant="light" mt="md" leftSection={<IconPlus size={16} />}>
                New booking
              </Button>
            </Paper>
            <Box mt="lg">
              <OwnerNotes clientId={existing.id} />
            </Box>
          </Grid.Col>
        )}
      </Grid>
    </>
  );
}
