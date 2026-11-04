import { Box, Button, Center, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { IconAnchor, IconBriefcase, IconCrown, IconSteeringWheel } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { DemoBanner } from '../components/Layout';

export default function LoginPage() {
  const { state, signIn } = useStore();
  const navigate = useNavigate();
  const go = (id: string, to: string) => {
    signIn(id);
    navigate(to);
  };
  const captains = state.users.filter((u) => u.role === 'captain');
  const vesselName = (id?: string) => state.vessels.find((v) => v.id === id)?.name;

  return (
    <Box mih="100vh">
      <header>
        <DemoBanner />
      </header>
      <Container component="main" size={460} py={48}>
        <Center mb="md">
          <IconAnchor size={44} color="var(--rv-ink)" aria-hidden />
        </Center>
        <Title order={1} ta="center" c="var(--rv-ink)">
          Rivera Transmarine
        </Title>
        <Text ta="center" c="dimmed" mb="xl">
          Choose who you want to see the system as. The real version asks for an email and password.
        </Text>

        <Paper withBorder p="lg">
          <Stack gap="sm">
            <Button size="lg" leftSection={<IconCrown size={20} />} onClick={() => go('owner', '/')}>
              Owner
            </Button>
            <Button size="lg" variant="light" leftSection={<IconBriefcase size={20} />} onClick={() => go('staff', '/')}>
              Office staff
            </Button>
          </Stack>

          <Text fw={600} mt="xl" mb="xs">
            Captain
          </Text>
          <Stack gap="xs">
            {captains.map((c) => (
              <Button
                key={c.id}
                variant="default"
                size="md"
                justify="space-between"
                leftSection={<IconSteeringWheel size={18} />}
                rightSection={<Text size="sm" c="dimmed">{vesselName(c.vesselId)}</Text>}
                onClick={() => go(c.id, '/captain')}
              >
                {c.name}
              </Button>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
