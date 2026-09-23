import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CautionIcon, DashIcon, LeafIcon } from './icons';

describe('icons', () => {
  it.each([
    ['LOW leaf', LeafIcon],
    ['HIGH caution', CautionIcon],
    ['NO DATA dash', DashIcon],
  ])('%s is decorative — hidden from assistive tech', (_label, Icon) => {
    const { container } = render(<Icon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});
