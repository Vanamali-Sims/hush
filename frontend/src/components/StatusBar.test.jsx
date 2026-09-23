import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  it('renders nothing until data age is known', () => {
    const { container } = render(<StatusBar data={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('says when the live feed is in use and how old it is', () => {
    render(<StatusBar data={{ source: 'live', age_min: 18 }} />);
    expect(
      screen.getByText(/pedestrian data: live feed · updated 18 min ago/i),
    ).toBeInTheDocument();
  });

  it('does not pretend a snapshot is live', () => {
    render(<StatusBar data={{ source: 'snapshot', age_min: 40 }} />);
    expect(
      screen.getByText(/saved copy \(the live feed is not available right now\)/i),
    ).toBeInTheDocument();
  });

  it('says updated just now when the age is under a minute', () => {
    render(<StatusBar data={{ source: 'database', age_min: 0 }} />);
    expect(screen.getByText(/synced feed · updated just now/i)).toBeInTheDocument();
  });
});
