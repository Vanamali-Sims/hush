import { useId, useState } from 'react';
import { SlidersIcon } from './icons';

/** The user's own comfort threshold, in people per minute.
 * Stored on the device only. Changing it re-labels routes immediately. */
export function ThresholdControl({ threshold, onChange }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="threshold">
      <button
        type="button"
        className="threshold__summary"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersIcon size={16} />
        My limit: {threshold} people/min · {open ? 'Close' : 'Adjust'}
      </button>
      {open ? (
        <div className="threshold__panel">
          <label htmlFor={id}>
            Routes averaging more than this are marked HIGH. Pick the number that feels
            right for you.
          </label>
          <div className="threshold__inputs">
            <input
              id={id}
              type="range"
              min="20"
              max="300"
              step="5"
              value={threshold}
              onChange={(e) => onChange(Number(e.target.value))}
            />
            <input
              type="number"
              min="20"
              max="300"
              value={threshold}
              aria-label="Threshold in people per minute"
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onChange(Math.min(300, Math.max(20, n)));
              }}
            />
          </div>
          <p className="field-note">Saved on this device only.</p>
        </div>
      ) : null}
    </div>
  );
}
