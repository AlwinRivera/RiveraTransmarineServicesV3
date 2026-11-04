import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, type CSSVariablesResolver } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';
import { theme } from './theme';
import { StoreProvider } from './data/store';
import { PrefsProvider } from './lib/prefs';
import App from './App';

// Text colors chosen to pass WCAG AA contrast (4.5:1) in each color scheme.
const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-dimmed': '#4f5d68',
    '--rv-attention-text': '#b34102',
    '--rv-ok-text': '#0b6b4f',
    '--rv-quoted': '#862e9c',
  },
  dark: {
    '--mantine-color-dimmed': '#a9b8c3',
    '--mantine-color-anchor': '#a6c2d6',
    '--rv-attention-text': '#ffa66e',
    '--rv-ok-text': '#63e6be',
    '--rv-quoted': '#e599f7',
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light" cssVariablesResolver={cssVariablesResolver}>
      <DatesProvider settings={{ firstDayOfWeek: 1 }}>
        <Notifications position="top-center" />
        <PrefsProvider>
          <StoreProvider>
            <App />
          </StoreProvider>
        </PrefsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
