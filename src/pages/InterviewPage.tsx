import { Alert, Anchor, Badge, Button, Grid, Group, Paper, Progress, Select, Stack, Text, TextInput, Textarea, Title, UnstyledButton } from '@mantine/core';
import { IconCheck, IconMicrophone, IconPlayerSkipForward } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { INTERVIEW, TOPICS } from '../data/continuity';
import { PageHeader, showDone, showError } from '../components/common';

export default function InterviewPage() {
  const { state, savePlaybookEntry } = useStore();
  const answeredIds = new Set(state.playbook.map((e) => e.questionId).filter(Boolean) as string[]);
  const open = INTERVIEW.filter((q) => !answeredIds.has(q.id));
  const [skipped, setSkipped] = useState<string[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const queue = [...open.filter((q) => !skipped.includes(q.id)), ...open.filter((q) => skipped.includes(q.id))];
  const current = INTERVIEW.find((q) => q.id === pickedId && !answeredIds.has(q.id)) ?? queue[0];

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [vesselId, setVesselId] = useState<string | null>(null);
  const reset = () => {
    setTitle('');
    setBody('');
    setClientId(null);
    setVesselId(null);
    setPickedId(null);
  };

  const save = () => {
    if (!current) return;
    try {
      savePlaybookEntry({
        topic: current.topic,
        title: title.trim() || current.question,
        body,
        clientId: clientId ?? undefined,
        vesselId: vesselId ?? undefined,
        questionId: current.id,
        source: `Interview with the owner, ${dayjs().format('D MMM YYYY')}`,
      });
      showDone('Saved to the Playbook.');
      reset();
    } catch (e) {
      showError(e);
    }
  };

  const done = answeredIds.size;

  return (
    <>
      <PageHeader
        title="Interview the owner"
        sub={`${done} of ${INTERVIEW.length} questions answered`}
        actions={
          <Button component={Link} to="/playbook" variant="default">
            Back to the Playbook
          </Button>
        }
      />
      <Progress value={(done / INTERVIEW.length) * 100} mb="lg" maw={860} aria-label={`${done} of ${INTERVIEW.length} questions answered`} />

      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Alert icon={<IconMicrophone size={18} />} color="harbor" variant="light" mb="lg" title="How to run a session">
            Ask permission to record, then use your phone's voice recorder while you talk. Let him tell stories; the details
            are in the stories. Afterward, write the key points here. Three or four questions is a good session.
          </Alert>

          {current ? (
            <Paper withBorder p="lg">
              <Badge variant="light" color="harbor" mb="sm">
                {TOPICS[current.topic].label}
              </Badge>
              <Title order={2} mb={6} lh={1.3}>
                {current.question}
              </Title>
              {current.followUp && (
                <Text c="dimmed" mb="md">
                  Follow up: {current.followUp}
                </Text>
              )}
              <Stack>
                <Textarea
                  label="His answer"
                  description="The key points, in his words where you can."
                  autosize
                  minRows={6}
                  value={body}
                  onChange={(e) => setBody(e.currentTarget.value)}
                />
                <TextInput
                  label="Short title"
                  description="Optional. Leave it empty to use the question."
                  placeholder="For example: Always get the deposit before confirming"
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                />
                <Group grow align="flex-start">
                  <Select label="About a client" placeholder="None" clearable searchable data={state.clients.map((c) => ({ value: c.id, label: c.company }))} value={clientId} onChange={setClientId} />
                  <Select label="About a vessel" placeholder="None" clearable data={state.vessels.map((v) => ({ value: v.id, label: v.name }))} value={vesselId} onChange={setVesselId} />
                </Group>
                <Group>
                  <Button leftSection={<IconCheck size={18} />} onClick={save} disabled={!body.trim()}>
                    Save to the Playbook
                  </Button>
                  <Button
                    variant="subtle"
                    leftSection={<IconPlayerSkipForward size={18} />}
                    onClick={() => {
                      setSkipped((s) => [...s.filter((x) => x !== current.id), current.id]);
                      reset();
                    }}
                  >
                    Skip for now
                  </Button>
                </Group>
              </Stack>
            </Paper>
          ) : (
            <Paper withBorder p="lg">
              <Title order={2} mb="xs">
                Every question is answered
              </Title>
              <Text mb="md">
                Ask him to read the Playbook and correct anything that's wrong. Then keep adding notes whenever he explains something new.
              </Text>
              <Button component={Link} to="/playbook">
                Open the Playbook
              </Button>
            </Paper>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Title order={2} size="h3" mb="xs">
            All questions
          </Title>
          <Stack gap={0}>
            {INTERVIEW.map((q) => {
              const isDone = answeredIds.has(q.id);
              const isCurrent = current?.id === q.id;
              return (
                <UnstyledButton
                  key={q.id}
                  onClick={() => {
                    if (!isDone) {
                      reset();
                      setPickedId(q.id);
                    }
                  }}
                  disabled={isDone}
                  py={8}
                  px={6}
                  aria-current={isCurrent ? 'step' : undefined}
                  style={{
                    borderTop: '1px solid var(--rv-line)',
                    background: isCurrent ? 'color-mix(in srgb, var(--rv-line) 45%, transparent)' : undefined,
                    cursor: isDone ? 'default' : 'pointer',
                  }}
                >
                  <Group gap={8} wrap="nowrap" align="flex-start">
                    <Text span size="sm" fw={700} c={isDone ? 'var(--rv-ok-text)' : 'dimmed'} w={18} aria-hidden>
                      {isDone ? '✓' : '·'}
                    </Text>
                    <Text size="sm" c={isDone ? 'dimmed' : undefined}>
                      {q.question}
                      {isDone && <Text span size="sm" c="var(--rv-ok-text)"> Answered</Text>}
                    </Text>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
          <Text size="sm" c="dimmed" mt="md">
            Answers show up in the{' '}
            <Anchor component={Link} to="/playbook" size="sm" underline="always">
              Playbook
            </Anchor>
            , and on the matching client and vessel pages.
          </Text>
        </Grid.Col>
      </Grid>
    </>
  );
}
