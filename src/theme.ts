import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Harbor navy: the company's main color.
const harbor: MantineColorsTuple = [
  '#eaf1f6', '#d3e1eb', '#a6c2d6', '#76a1c0', '#4f85ad',
  '#3a73a0', '#2c6493', '#225580', '#1a4566', '#12324A',
];

// Life-ring orange: used only for things that need someone's attention.
const lifering: MantineColorsTuple = [
  '#fff1e6', '#ffe0cc', '#ffbf99', '#ff9c61', '#fb7f36',
  '#f56c1a', '#e8590c', '#cc4b06', '#b34102', '#8f3300',
];

// Dark mode in harbor navy instead of plain gray. Mantine uses [7] for the page and [0] for text.
const dark: MantineColorsTuple = [
  '#dbe7ef', '#b8c7d2', '#93a6b4', '#6c8090', '#4a5d6b',
  '#2a3a46', '#1c2a35', '#15222c', '#0f1b24', '#0a141b',
];

// Status greens and teals, deepened so white text passes WCAG AA (4.5:1) at shades 7 to 9.
const green: MantineColorsTuple = [
  '#ebfbee', '#d3f9d8', '#b2f2bb', '#8ce99a', '#69db7c',
  '#51cf66', '#40c057', '#26803a', '#1f6e31', '#1b5e2a',
];
const teal: MantineColorsTuple = [
  '#e6fcf5', '#c3fae8', '#96f2d7', '#63e6be', '#38d9a9',
  '#20c997', '#12b886', '#0b7a5a', '#09694d', '#075a42',
];

export const theme = createTheme({
  primaryColor: 'harbor',
  primaryShade: { light: 9, dark: 7 },
  autoContrast: true,
  luminanceThreshold: 0.2,
  colors: { harbor, lifering, dark, green, teal },
  fontFamily: 'Barlow, system-ui, sans-serif',
  headings: {
    fontFamily: '"Barlow Semi Condensed", Barlow, system-ui, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.15' },
      h2: { fontSize: '1.5rem', lineHeight: '1.2' },
      h3: { fontSize: '1.2rem', lineHeight: '1.25' },
    },
  },
  defaultRadius: 'sm',
  radius: { sm: '6px', md: '10px' },
  components: {
    Button: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'md' } },
    Badge: { defaultProps: { tt: 'none' } },
    Notification: { defaultProps: { closeButtonProps: { 'aria-label': 'Dismiss message' } } },
  },
});
