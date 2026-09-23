import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlaceField } from './PlaceField';

vi.mock('../api', () => ({
  geocode: vi.fn(),
}));

import { geocode } from '../api';

describe('PlaceField (screen reader)', () => {
  it('associates the visible label with the input', () => {
    render(<PlaceField id="from" label="From" value={null} onSelect={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: 'From' });
    expect(input).toHaveAttribute('id', 'from');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('exposes current-location as a named button', async () => {
    const user = userEvent.setup();
    const onUseCurrentLocation = vi.fn();
    render(
      <PlaceField
        id="from"
        label="From"
        value={null}
        onSelect={vi.fn()}
        onUseCurrentLocation={onUseCurrentLocation}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Use my current location' }));
    expect(onUseCurrentLocation).toHaveBeenCalledOnce();
  });

  it('opens a listbox of suggestions a screen reader can move through', async () => {
    const user = userEvent.setup();
    geocode.mockResolvedValue({
      results: [{ label: 'Flinders Street Station', lat: -37.8183, lon: 144.9671 }],
    });
    const onSelect = vi.fn();
    render(<PlaceField id="to" label="To" value={null} onSelect={onSelect} />);

    await user.type(screen.getByRole('textbox', { name: 'To' }), 'Flinders');
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'To' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Flinders Street Station' }));
    expect(onSelect).toHaveBeenCalledWith({
      label: 'Flinders Street Station',
      lat: -37.8183,
      lon: 144.9671,
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
