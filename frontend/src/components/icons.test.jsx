import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CautionIcon, DashIcon, LeafIcon } from './icons';

describe('icons', () => {
  it('keeps badge icons decorative — hidden from assistive tech', () => {
    for (const Icon of [LeafIcon, CautionIcon, DashIcon]) {
      const { container, unmount } = render(<Icon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('focusable', 'false');
      unmount();
    }
  });
});
