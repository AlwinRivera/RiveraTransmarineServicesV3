import { Button, Chip, Group, Progress, Stack, Text, TextInput } from '@mantine/core';
import { IconMicrophone, IconPlus, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { INTERVIEW, TOPICS, TOPIC_ORDER } from '../data/continuity';
import { PageHeader } from '../components/common';
import { EntryModal, PlaybookEntryCard, blankEntry, type EntryDraft } from '../components/PlaybookEntryCard';

export default function PlaybookPage() {
  const { state } = useStore();
  const { client, vessel } = useLookups();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<string>('all');
  const [editing, setEditing] = useState<EntryDraft | null>(null);

  const answered = new Set(state.playbook.map((e) => e.questionId).filter(Boolean)).size;
  const entries = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.playbook
      .filter((e) => topic === 'all' || e.topic === topic)
      .filter((e) => {
        if (!term) return true;
        const hay = [e.title, e.body, e.clientId && client(e.clientId)?.company, e.vesselId && vessel(e.vesselId)?.name].join(' ').toLowerCase();
        return hay.includes(term);
      })
      .sort((a, b) => TOPIC_ORDER.indexOf(a.topic) - TOPIC_ORDER.indexOf(b.topic) || b.changedAt.localeCompare(a.changedAt));
  }, [state.playbook, q, topic, client, vessel]);

  return (
    <>
      <PageHeader
        title="Playbook"
        sub="What the owner knows, written down so the business can run without him."
        actions={
          <>
            <Button component={Link} to="/playbook/interview" leftSection={<IconMicrophone size={18} />}>
              Interview the owner
            </Button>
            <Button variant="default" leftSection={<IconPlus size={18} />} onClick={() => setEditing(blankEntry({ topic: topic === 'all' ? 'clients' : (topic as EntryDraft['topic']) }))}>
              Add note
            </Button>
          </>
        }
      />

      <Stack gap={4} mb="lg" maw={520}>
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Interview progress
          </Text>
          <Text size="sm" className="rv-num">
            {answered} of {INTERVIEW.length} questions answered
          </Text>
        </Group>
        <Progress value={(answered / INTERVIEW.length) * 100} aria-label={`${answered} of ${INTERVIEW.length} interview questions answered`} />
      </Stack>

      <TextInput
        placeholder="Search, for example: Leyte, pricing, weather"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
        mb="sm"
        maw={520}
        aria-label="Search the Playbook"
      />
      <Chip.Group value={topic} onChange={(v) => setTopic(v as string)}>
        <Group gap={6} mb="lg">
          <Chip value="all" variant="outline">
            All topics
          </Chip>
          {TOPIC_ORDER.map((t) => (
            <Chip key={t} value={t} variant="outline">
              {TOPICS[t].label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>

      {topic !== 'all' && (
        <Text c="dimmed" mb="md">
          {TOPICS[topic as keyof typeof TOPICS].hint}.
        </Text>
      )}

      <Stack gap="md" maw={860}>
        {entries.map((e) => (
          <PlaybookEntryCard key={e.id} entry={e} onEdit={(x) => setEditing(x)} />
        ))}
        {entries.length === 0 && (
          <Text c="dimmed">
            Nothing here yet. Start an interview with the owner, or add a note yourself.
          </Text>
        )}
      </Stack>

      <EntryModal draft={editing} onClose={() => setEditing(null)} />
    </>
  );
}
