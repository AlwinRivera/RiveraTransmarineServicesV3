import { AppShell, Badge, Burger, Button, Group, NavLink, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconAnchor,
  IconCalendarWeek,
  IconFileText,
  IconBook,
  IconLayoutDashboard,
  IconLifebuoy,
  IconLogout,
  IconSettings,
  IconShip,
  IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../data/store';
import { DisplayMenu } from './DisplayMenu';

const NAV = [
  { to: '/', label: 'Today', icon: IconLayoutDashboard },
  { to: '/calendar', label: 'Fleet calendar', icon: IconCalendarWeek },
  { to: '/bookings', label: 'Bookings', icon: IconFileText },
  { to: '/vessels', label: 'Vessels', icon: IconShip },
  { to: '/clients', label: 'Clients', icon: IconUsers },
  { to: '/playbook', label: 'Playbook', icon: IconBook },
];

export function DemoBanner() {
  return (
    <Text size="xs" ta="center" py={4} bg="lifering.0" c="lifering.9">
      Demo with made-up sample data. Changes stay in this browser only.
    </Text>
  );
}

export default function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, signOut } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <AppShell
      header={{ height: 84 }}
      navbar={{ width: 230, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', sm: 'xl' }}
    >
      <AppShell.Header>
        <DemoBanner />
        <Group h={56} px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Open menu" />
            <UnstyledButton component={Link} to="/" onClick={close}>
              <Group gap={8} wrap="nowrap">
                <IconAnchor size={26} color="var(--rv-ink)" aria-hidden />
                <Text fw={600} size="lg" ff="heading" c="var(--rv-ink)" style={{ whiteSpace: 'nowrap' }}>
                  Rivera Transmarine
                </Text>
              </Group>
            </UnstyledButton>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Badge variant="light" color="harbor" visibleFrom="xs">
              {user?.role === 'owner' ? 'Owner' : 'Office staff'}
            </Badge>
            <DisplayMenu />
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconLogout size={16} />}
              onClick={() => {
                signOut();
                navigate('/login');
              }}
            >
              Switch view
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            component={Link}
            to={n.to}
            label={n.label}
            leftSection={<n.icon size={20} />}
            active={isActive(n.to)}
            onClick={close}
            fw={500}
            styles={{ label: { fontSize: 16 } }}
          />
        ))}
        {user?.role === 'owner' && (
          <NavLink
            component={Link}
            to="/handover"
            label="Handover plan"
            leftSection={<IconLifebuoy size={20} />}
            active={isActive('/handover')}
            onClick={close}
            fw={500}
            styles={{ label: { fontSize: 16 } }}
          />
        )}
        {user?.role === 'owner' && (
          <NavLink
            component={Link}
            to="/settings"
            label="Settings"
            leftSection={<IconSettings size={20} />}
            active={isActive('/settings')}
            onClick={close}
            fw={500}
            styles={{ label: { fontSize: 16 } }}
            mt="auto"
          />
        )}
      </AppShell.Navbar>

      <AppShell.Main maw={1280}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
