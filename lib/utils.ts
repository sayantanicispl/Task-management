export const CHIP_COLORS = [
  { bg: 'var(--blue-bg)', color: 'var(--blue-text)' },
  { bg: 'var(--teal-bg)', color: 'var(--teal-text)' },
  { bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
  { bg: 'var(--purple-bg)', color: 'var(--purple-text)' },
  { bg: 'var(--coral-bg)', color: 'var(--coral-text)' },
  { bg: 'var(--pink-bg)', color: 'var(--pink-text)' },
];

export function cc(i: number) {
  return CHIP_COLORS[i % CHIP_COLORS.length];
}

export function initials(n: string) {
  return n
    .trim()
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
