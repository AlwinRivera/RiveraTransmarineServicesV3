import { Badge, Button, FileButton, Group, Modal, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { IconDownload, IconRefresh, IconUpload } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useStore } from '../data/store';
import { PageHeader, showDone, showError } from '../components/common';
import type { DemoState } from '../types';

const ROLE_LABEL = { owner: 'Owner', staff: 'Office staff', captain: 'Captain' } as const;

export default function SettingsPage() {
  const { state, resetDemo, restore } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const vesselName = (id?: string) => state.vessels.find((v) => v.id === id)?.name;

  const download = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rivera-backup-${dayjs().format('YYYY-MM-DD')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File | null) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as DemoState;
      restore(data);
      showDone(`Restored ${data.bookings.length} bookings from ${file.name}.`);
    } catch (e) {
      showError(e instanceof SyntaxError ? new Error('That file is not a Rivera backup.') : e);
    }
  };

  return (
    <>
      <PageHeader title="Settings" sub="Only the owner sees this screen." />
      <Stack gap="xl" maw={860}>
        <Paper withBorder p="lg">
          <Title order={2} size="h3" mb={4}>
            People who can log in
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            In the real version, the owner adds staff and captains here, and can turn off an account when someone leaves.
          </Text>
          <Table.ScrollContainer minWidth={520}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Vessel</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {state.users.map((u) => (
                  <Table.Tr key={u.id}>
                    <Table.Td>
                      {u.name}
                      <Text size="xs" c="dimmed">
                        {u.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={u.role === 'captain' ? 'teal' : 'harbor'}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{vesselName(u.vesselId) ?? ''}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>

        <Paper withBorder p="lg">
          <Title order={2} size="h3" mb={4}>
            Backup
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Download a copy of every record once a week and keep it somewhere safe. Restore replaces everything with the file you choose.
          </Text>
          <Group>
            <Button leftSection={<IconDownload size={18} />} onClick={download}>
              Download backup
            </Button>
            <FileButton onChange={upload} accept="application/json">
              {(props) => (
                <Button variant="default" leftSection={<IconUpload size={18} />} {...props}>
                  Restore from file
                </Button>
              )}
            </FileButton>
          </Group>
        </Paper>

        <Paper withBorder p="lg">
          <Title order={2} size="h3" mb={4}>
            Demo data
          </Title>
          <Text size="sm" c="dimmed" mb="md">
            Puts the sample vessels, clients and bookings back the way they started, with dates moved to today.
          </Text>
          <Button variant="outline" color="red" leftSection={<IconRefresh size={18} />} onClick={() => setConfirmReset(true)}>
            Reset demo data
          </Button>
        </Paper>
      </Stack>

      <Modal opened={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?" centered>
        <Text mb="md">Every change made in this browser will be replaced with the original sample data.</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmReset(false)}>
            Keep my changes
          </Button>
          <Button
            color="red"
            onClick={() => {
              resetDemo();
              setConfirmReset(false);
              showDone('Demo data reset.');
            }}
          >
            Reset demo data
          </Button>
        </Group>
      </Modal>
    </>
  );
}
