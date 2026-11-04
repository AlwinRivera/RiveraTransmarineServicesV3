import { ActionIcon, Menu, SegmentedControl, Stack, Switch, Text, useMantineColorScheme } from '@mantine/core';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { usePrefs, type TextSize } from '../lib/prefs';

/** Text size, light or dark, and (for captains) sun mode. Saved on this device. */
export function DisplayMenu({ showSun = false, variant = 'subtle' }: { showSun?: boolean; variant?: 'subtle' | 'white' }) {
  const { textSize, setTextSize, sun, setSun } = usePrefs();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu position="bottom-end" width={280} closeOnItemClick={false} withinPortal>
      <Menu.Target>
        <ActionIcon variant={variant} size="lg" aria-label="Display settings" color={variant === 'white' ? 'harbor' : undefined}>
          <IconAdjustmentsHorizontal size={20} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown p="md">
        <Stack gap="md">
          <div>
            <Text size="sm" fw={600} mb={6} id="text-size-label">
              Text size
            </Text>
            <SegmentedControl
              fullWidth
              aria-labelledby="text-size-label"
              value={textSize}
              onChange={(v) => setTextSize(v as TextSize)}
              data={[
                { value: 'normal', label: 'Normal' },
                { value: 'large', label: 'Large' },
                { value: 'larger', label: 'Larger' },
              ]}
            />
          </div>
          <div>
            <Text size="sm" fw={600} mb={6} id="theme-label">
              Colors
            </Text>
            <SegmentedControl
              fullWidth
              aria-labelledby="theme-label"
              value={colorScheme}
              onChange={(v) => setColorScheme(v as 'light' | 'dark' | 'auto')}
              data={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto' },
              ]}
            />
          </div>
          {showSun && (
            <Switch
              size="md"
              checked={sun}
              onChange={(e) => {
                const on = e.currentTarget.checked;
                setSun(on);
                if (on) setColorScheme('light');
              }}
              label="Sun mode"
              description="Black on white with bold text, for reading in bright sunlight"
            />
          )}
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
