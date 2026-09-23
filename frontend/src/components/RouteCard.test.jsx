import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RouteCard } from './RouteCard';

function route(overrides = {}) {
  return {
    id: 'r1',
    via: 'Swanston St',
    duration_min: 12,
    avg_density: 62,
    segments_no_data: 0,
    segments_total: 8,
    worst: { value: 70, street: 'Little Collins St' },
    ...overrides,
  };
}

function renderCard(props = {}) {
  return render(
    <RouteCard
      route={route()}
      threshold={100}
      selected={false}
      calmest={false}
      onSelect={vi.fn()}
      {...props}
    />,
  );
}

describe('RouteCard (screen reader)', () => {
  it('pairs every badge with spoken text, not colour alone', () => {
    const { rerender } = renderCard({ route: route({ avg_density: 62 }) });
    expect(screen.getByText('LOW', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText(/at or below your limit of 100/i)).toBeInTheDocument();

    rerender(
      <RouteCard
        route={route({ avg_density: 148 })}
        threshold={100}
        selected={false}
        calmest={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('HIGH', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText(/above your limit of 100/i)).toBeInTheDocument();

    rerender(
      <RouteCard
        route={route({ avg_density: null })}
        threshold={100}
        selected={false}
        calmest={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('NO DATA', { selector: '.badge' })).toBeInTheDocument();
    expect(screen.getByText(/not assumed calm/i)).toBeInTheDocument();
  });

  it('marks the selected card with aria-current and names the route heading', () => {
    renderCard({ selected: true });
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('heading', { level: 3, name: 'Via Swanston St' }),
    ).toBeInTheDocument();
  });

  it('speaks Calmest of these when the route is the recommendation', () => {
    renderCard({ calmest: true });
    expect(screen.getByText('Calmest of these')).toBeInTheDocument();
  });

  it('keeps the worst-point detail collapsed until the user opens it', async () => {
    const user = userEvent.setup();
    renderCard({
      route: route({
        avg_density: 60,
        worst: { value: 141, street: 'Little Collins St' },
      }),
    });

    const disclosure = screen.getByRole('button', {
      name: /worst point on this route/i,
    });
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/little collins st/i)).not.toBeInTheDocument();

    await user.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/little collins st/i)).toBeInTheDocument();
    expect(screen.getByText(/more than double this route's average/i)).toBeInTheDocument();
  });

  it('explains why Start is unavailable when the trip is not from current location', () => {
    renderCard({ selected: true, journeyAvailable: false });
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/start is only available when this trip begins at your current location/i),
    ).toBeInTheDocument();
  });

  it('offers a Start button when the trip begins at the current location', () => {
    renderCard({
      selected: true,
      journeyAvailable: true,
      onStartJourney: vi.fn(),
    });
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });
});
