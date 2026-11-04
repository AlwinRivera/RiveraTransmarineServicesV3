import { Anchor, Badge, Button, Group, Modal, Paper, Select, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLookups, useStore } from '../data/store';
import { TOPICS, TOPIC_ORDER } from '../data/continuity';
import { showDone, showError } from './common';
import { dateTime } from '../lib/format';
import type { PlaybookEntry, PlaybookTopic } from '../types';

export function PlaybookEntryCard({ entry, onEdit }: { entry: PlaybookEntry; onEdit: (e: PlaybookEntry) => void }) {
  const { client, vessel } = useLookups();
  const c = entry.clientId ? client(entry.clientId) : undefined;
  const v = entry.vesselId ? vessel(entry.vesselId) : undefined;
  return (
    <Paper withBorder p="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Text fw={600} size="lg" lh={1.3}>
          {entry.title}
        </Text>
        <Button variant="subtle" size="compact-sm" leftSection={<IconPencil size={14} />} onClick={() => onEdit(entry)} aria-label={`Edit: ${entry.title}`}>
          Edit
        </Button>
      </Group>
      <Text mt={6} style={{ whiteSpace: 'pre-wrap' }}>
        {entry.body}
      </Text>
      <Group gap="xs" mt="sm">
        <Badge variant="light" color="harbor">
          {TOPICS[entry.topic].label}
        </Badge>
        {c && (
          <Anchor component={Link} to={`/clients/${c.id}`} size="sm">
            {c.company}
          </Anchor>
        )}
        {v && (
          <Anchor component={Link} to={`/vessels/${v.id}`} size="sm">
            {v.name}
          </Anchor>
        )}
      </Group>
      <Text size="xs" c="dimmed" mt={6}>
        {entry.source}. Last changed by {entry.changedBy}, {dateTime(entry.changedAt)}
      </Text>
    </Paper>
  );
}

export type EntryDraft = Omit<PlaybookEntry, 'id' | 'createdAt' | 'changedBy' | 'changedAt'> & { id?: string };

export const blankEntry = (over: Partial<EntryDraft> = {}): EntryDraft => ({
  topic: 'clients',
  title: '',
  body: '',
  source: 'Written by office staff',
  ...over,
});

/** Add or edit one Playbook entry. */
export function EntryModal({ draft, onClose }: { draft: EntryDraft | null; onClose: () => void }) {
  const { state, savePlaybookEntry } = useStore();
  const [form, setForm] = useState<EntryDraft | null>(draft);
  // Reset when a different entry is opened.
  const [lastDraft, setLastDraft] = useState(draft);
  if (draft !== lastDraft) {
    setLastDraft(draft);
    setForm(draft);
  }
  if (!form) return null;
  const set = <K extends keyof EntryDraft>(k: K, v: EntryDraft[K]) => setForm({ ...form, [k]: v });

  return (
    <Modal opened={!!draft} onClose={onClose} title={form.id ? 'Edit Playbook entry' : 'Add to the Playbook'} size="lg" centered>
      <Stack>
        <Select
          label="Topic"
          data={TOPIC_ORDER.map((t) => ({ value: t, label: TOPICS[t].label }))}
          value={form.topic}
          onChange={(v) => v && set('topic', v as PlaybookTopic)}
          allowDeselect={false}
        />
        <TextInput label="Short title" placeholder="For example: Never sail Ace on tows over 30 hours" value={form.title} onChange={(e) => set('title', e.currentTarget.value)} />
        <Textarea label="Details" description="Write it the way he would say it." autosize minRows={4} value={form.body} onChange={(e) => set('body', e.currentTarget.value)} />
        <Group grow align="flex-start">
          <Select
            label="About a client"
            placeholder="None"
            clearable
            searchable
            data={state.clients.map((c) => ({ value: c.id, label: c.company }))}
            value={form.clientId ?? null}
            onChange={(v) => set('clientId', v ?? undefined)}
          />
          <Select
            label="About a vessel"
            placeholder="None"
            clearable
            data={state.vessels.map((v) => ({ value: v.id, label: v.name }))}
            value={form.vesselId ?? null}
            onChange={(v) => set('vesselId', v ?? undefined)}
          />
        </Group>
        <Button
          onClick={() => {
            try {
              savePlaybookEntry(form);
              showDone(form.id ? 'Playbook entry saved.' : 'Added to the Playbook.');
              onClose();
            } catch (e) {
              showError(e);
            }
          }}
        >
          {form.id ? 'Save entry' : 'Add to the Playbook'}
        </Button>
      </Stack>
    </Modal>
  );
}

/** The owner's know-how about one client or vessel, shown on its page. */
export function OwnerNotes({ clientId, vesselId }: { clientId?: string; vesselId?: string }) {
  const { state } = useStore();
  const [editing, setEditing] = useState<EntryDraft | null>(null);
  const notes = state.playbook.filter((e) => (clientId && e.clientId === clientId) || (vesselId && e.vesselId === vesselId));
  return (
    <Paper withBorder p="lg">
      <Group justify="space-between" mb="xs">
        <Title order={2} size="h3">
          Owner's notes
        </Title>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconPlus size={14} />}
          onClick={() => setEditing(blankEntry({ topic: clientId ? 'clients' : 'vessels', clientId, vesselId }))}
        >
          Add note
        </Button>
      </Group>
      {notes.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nothing written down yet. Ask the owner what he knows, and add it here.
        </Text>
      ) : (
        <Stack gap="sm">
          {notes.map((n) => (
            <PlaybookEntryCard key={n.id} entry={n} onEdit={setEditing} />
          ))}
        </Stack>
      )}
      <EntryModal draft={editing} onClose={() => setEditing(null)} />
    </Paper>
  );
}
