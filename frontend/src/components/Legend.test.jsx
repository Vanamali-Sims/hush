import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Legend } from './Legend';

describe('Legend (screen reader)', () => {
  it('explains LOW, HIGH and NO DATA in words, including the user threshold', () => {
    render(<Legend threshold={100} />);

    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('NO DATA')).toBeInTheDocument();
    expect(
      screen.getByText(/at or below your limit of 100 people\/min/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/above 100 people\/min/i)).toBeInTheDocument();
    expect(screen.getByText(/never silently counted as low/i)).toBeInTheDocument();
  });
});
