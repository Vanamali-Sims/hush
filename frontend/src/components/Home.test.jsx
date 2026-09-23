import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Home } from './Home';

describe('Home (screen reader)', () => {
  it('exposes a single page heading and the two destination choices as buttons', () => {
    render(<Home onNavigate={vi.fn()} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Where would you like to go?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan a route/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /quiet space/i })).toBeEnabled();
  });

  it('announces unavailable features as disabled, not as missing', () => {
    render(<Home onNavigate={vi.fn()} />);

    expect(screen.getByRole('button', { name: /crowd predictor/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /chat helper/i })).toBeDisabled();
    expect(screen.getAllByText('Coming later')).toHaveLength(2);
  });

  it('keeps support contacts in a labelled region with a real phone link', () => {
    render(<Home onNavigate={vi.fn()} />);

    const support = screen.getByRole('generic', { name: 'Support and help' });
    expect(support).toBeInTheDocument();

    const lifeline = screen.getByRole('link', { name: /lifeline/i });
    expect(lifeline).toHaveAttribute('href', 'tel:131114');
  });

  it('navigates by the button name a screen reader would speak', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Home onNavigate={onNavigate} />);

    await user.click(screen.getByRole('button', { name: /plan a route/i }));
    expect(onNavigate).toHaveBeenCalledWith('plan');

    await user.click(screen.getByRole('button', { name: /quiet space/i }));
    expect(onNavigate).toHaveBeenCalledWith('refuge');
  });

  it('toggles FAQ with aria-expanded and only then reveals the answers', async () => {
    const user = userEvent.setup();
    render(<Home onNavigate={vi.fn()} />);

    const faq = screen.getByRole('button', { name: /faq/i });
    expect(faq).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/how does hush decide high or low/i)).not.toBeInTheDocument();

    await user.click(faq);
    expect(faq).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/how does hush decide high or low/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a gap in coverage is never assumed to be calm/i),
    ).toBeInTheDocument();
  });

  it('hides decorative icons from the accessibility tree', () => {
    const { container } = render(<Home onNavigate={vi.fn()} />);
    const icons = container.querySelectorAll('svg.icon');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveAttribute('focusable', 'false');
    });
  });
});
