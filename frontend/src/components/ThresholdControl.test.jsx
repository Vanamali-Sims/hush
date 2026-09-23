import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThresholdControl } from './ThresholdControl';

describe('ThresholdControl (screen reader)', () => {
  it('announces the current limit on the disclosure button', () => {
    render(<ThresholdControl threshold={100} onChange={vi.fn()} />);
    const toggle = screen.getByRole('button', { name: /my limit: 100 people\/min/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText(/routes averaging more than this/i)).not.toBeInTheDocument();
  });

  it('reveals a labelled slider and a named number field', async () => {
    const user = userEvent.setup();
    render(<ThresholdControl threshold={100} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /my limit/i }));
    expect(screen.getByRole('button', { name: /my limit/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('slider', { name: /routes averaging more than this/i })).toHaveValue(
      '100',
    );
    expect(
      screen.getByRole('spinbutton', { name: 'Threshold in people per minute' }),
    ).toHaveValue(100);
  });

  it('clamps typed values to the allowed range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThresholdControl threshold={100} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /my limit/i }));

    const number = screen.getByRole('spinbutton', {
      name: 'Threshold in people per minute',
    });
    await user.clear(number);
    await user.type(number, '5');
    expect(onChange).toHaveBeenCalledWith(20);

    await user.clear(number);
    await user.type(number, '400');
    expect(onChange).toHaveBeenCalledWith(300);
  });
});
