import { Alert, Checkbox, Group, Paper, Progress, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useStore } from '../data/store';
import { PageHeader, showError } from '../components/common';
import { dateTime } from '../lib/format';
import type { HandoverArea, HandoverItem } from '../types';

const AREAS: { area: HandoverArea; title: string }[] = [
  { area: 'Knowledge', title: 'His knowledge' },
  { area: 'People', title: 'Who takes over' },
  { area: 'Legal', title: 'Legal' },
  { area: 'Money', title: 'Money' },
  { area: 'Documents', title: 'Papers and accounts' },
];

function Item({ item }: { item: HandoverItem }) {
  const { setHandoverDone } = useStore();
  const [note, setNote] = useState(item.note ?? '');
  const toggle = (done: boolean) => {
    try {
      setHandoverDone(item.id, done, note || undefined);
    } catch (e) {
      showError(e);
    }
  };
  return (
    <Paper withBorder p="md">
      <Checkbox
        size="md"
        checked={item.done}
        onChange={(e) => toggle(e.currentTarget.checked)}
        label={
          <Text fw={600} td={item.done ? 'line-through' : undefined}>
            {item.title}
          </Text>
        }
        description={item.detail}
      />
      <Textarea
        mt="sm"
        ml={36}
        size="sm"
        placeholder="Notes: who, when, what was decided"
        aria-label={`Notes for: ${item.title}`}
        autosize
        minRows={1}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        onBlur={() => note !== (item.note ?? '') && setHandoverDone(item.id, item.done, note)}
      />
      {item.done && item.doneAt && (
        <Text size="xs" c="dimmed" mt={6} ml={36}>
          Done by {item.doneBy}, {dateTime(item.doneAt)}
        </Text>
      )}
    </Paper>
  );
}

export default function HandoverPage() {
  const { state } = useStore();
  const done = state.handover.filter((h) => h.done).length;
  const total = state.handover.length;

  return (
    <>
      <PageHeader title="Handover plan" sub="The steps that keep the business running if the owner can no longer lead it." />
      <Stack gap={4} mb="lg" maw={860}>
        <Group justify="space-between">
          <Text fw={600}>Progress</Text>
          <Text className="rv-num">
            {done} of {total} steps done
          </Text>
        </Group>
        <Progress value={(done / total) * 100} color="teal" size="lg" aria-label={`${done} of ${total} handover steps done`} />
      </Stack>

      <Alert icon={<IconInfoCircle size={18} />} color="gray" variant="light" mb="xl" maw={860}>
        This list is a starting point, not legal advice. Take the Legal and Money steps to a Philippine lawyer and accountant.
      </Alert>

      <Stack gap="xl" maw={860}>
        {AREAS.map(({ area, title }) => {
          const items = state.handover.filter((h) => h.area === area);
          const areaDone = items.filter((h) => h.done).length;
          return (
            <section key={area}>
              <Group justify="space-between" mb="xs">
                <Title order={2} size="h3">
                  {title}
                </Title>
                <Text size="sm" c="dimmed" className="rv-num">
                  {areaDone} of {items.length}
                </Text>
              </Group>
              <Stack gap="sm">
                {items.map((h) => (
                  <Item key={h.id} item={h} />
                ))}
              </Stack>
            </section>
          );
        })}
      </Stack>
    </>
  );
}
