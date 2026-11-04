import { Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useStore } from '../data/store';
import { vesselNow } from '../data/rules';
import { NOW_COLOR, PageHeader } from '../components/common';
import type { VesselType } from '../types';

const GROUPS: { type: VesselType; title: string }[] = [
  { type: 'LCT', title: 'Landing craft (LCT)' },
  { type: 'Tugboat', title: 'Tugboats' },
  { type: 'Barge', title: 'Barges' },
];

export default function VesselsPage() {
  const { state } = useStore();
  return (
    <>
      <PageHeader title="Vessels" sub={`${state.vessels.length} in the fleet`} />
      <Stack gap="xl">
        {GROUPS.map((g) => (
          <div key={g.type}>
            <Title order={2} size="h3" mb="sm">
              {g.title}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {state.vessels
                .filter((v) => v.type === g.type)
                .map((v) => {
                  const now = vesselNow(v, state.bookings);
                  return (
                    <UnstyledButton key={v.id} component={Link} to={`/vessels/${v.id}`}>
                      <Paper withBorder p="md" h="100%" style={{ borderLeft: `6px solid ${NOW_COLOR[now.state]}` }}>
                        <Text fw={600} size="lg">
                          {v.name}
                        </Text>
                        <Text size="sm" c="dimmed" mb="xs">
                          {v.capacity}
                        </Text>
                        <Text size="sm">{now.where}</Text>
                        <Text size="sm" c="dimmed">
                          {now.next}
                        </Text>
                      </Paper>
                    </UnstyledButton>
                  );
                })}
            </SimpleGrid>
          </div>
        ))}
      </Stack>
    </>
  );
}
