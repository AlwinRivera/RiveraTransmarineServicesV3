import { Badge, Group, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import type { BookingStatus } from '../types';
import { STATUS } from '../data/rules';
import type { VesselNow } from '../data/rules';

export function StatusBadge({ status, size = 'md' }: { status: BookingStatus; size?: 'sm' | 'md' | 'lg' }) {
  const s = STATUS[status];
  return (
    <Badge
      color={s.color}
      variant={status === 'inquiry' || status === 'quoted' ? 'outline' : 'filled'}
      size={size}
      radius="sm"
      tt="none"
      fw={600}
      style={{ flexShrink: 0 }}
    >
      {s.label}
    </Badge>
  );
}

/** Solid color for a status, deep enough for white text (delayed is bright yellow with dark text). */
export const statusVar = (status: BookingStatus) =>
  status === 'delayed'
    ? 'var(--mantine-color-yellow-5)'
    : status === 'quoted'
      ? 'var(--rv-quoted)'
      : `var(--mantine-color-${STATUS[status].color}-9)`;
export const statusTextColor = (status: BookingStatus) => (status === 'delayed' ? '#1a1a1a' : '#ffffff');

export const NOW_COLOR: Record<VesselNow['state'], string> = {
  underway: 'var(--mantine-color-teal-7)',
  delayed: 'var(--mantine-color-yellow-6)',
  loading: 'var(--mantine-color-harbor-6)',
  in_port: 'var(--mantine-color-gray-5)',
};

export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" mb="lg" wrap="wrap" gap="sm">
      <Stack gap={2}>
        <Title order={1}>{title}</Title>
        {sub && (
          <Text c="dimmed" size="md">
            {sub}
          </Text>
        )}
      </Stack>
      {actions && <Group gap="sm">{actions}</Group>}
    </Group>
  );
}

export function showError(e: unknown) {
  notifications.show({ color: 'red', title: 'Not saved', message: e instanceof Error ? e.message : String(e) });
}

export function showDone(message: string) {
  notifications.show({ color: 'teal', message });
}

/** Asks the phone for its location, giving up quietly after a few seconds. */
export function getPosition(): Promise<{ lat: number; lng: number } | undefined> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(undefined);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
      () => resolve(undefined),
      { timeout: 6000, maximumAge: 300000 },
    );
  });
}

export const mapsLink = (p: { lat: number; lng: number }) => `https://www.google.com/maps?q=${p.lat},${p.lng}`;
