import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RefugePanel } from './RefugePanel';

const FLAGSTAFF = {
  name: 'Flagstaff Gardens',
  kind: 'park',
  distance_m: 240,
  lat: -37.8106,
  lon: 144.9544,
};

describe('RefugePanel (screen reader)', () => {
  it('is a labelled region with a heading that matches the label', () => {
    render(<RefugePanel refuges={[FLAGSTAFF]} loading={false} />);

    expect(
      screen.getByRole('region', { name: 'Quiet spaces near you' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Quiet spaces near you' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  });

  it('announces loading through a polite live region', () => {
    render(<RefugePanel refuges={null} loading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Finding quiet spaces near you…');
  });

  it('names each refuge and exposes Take me there as a button', async () => {
    const user = userEvent.setup();
    const onPlanRoute = vi.fn();
    render(
      <RefugePanel refuges={[FLAGSTAFF]} loading={false} onPlanRoute={onPlanRoute} />,
    );

    expect(screen.getByText('Flagstaff Gardens')).toBeInTheDocument();
    expect(screen.getByText(/park · 240 m/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Take me there' }));
    expect(onPlanRoute).toHaveBeenCalledWith({
      label: 'Flagstaff Gardens',
      lat: -37.8106,
      lon: 144.9544,
    });
  });
});
