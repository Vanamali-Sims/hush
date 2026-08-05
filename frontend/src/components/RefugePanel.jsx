import { useState } from 'react';
import { getRefuges } from '../api';

const DEFAULT_POINT = { lat: -37.8136, lon: 144.9646, label: 'central Melbourne' };

/** "Quiet space now" — nearest low-stimulation refuges, one tap. */
export function RefugePanel({ origin, onRefuges }) {
  const [refuges, setRefuges] = useState(null);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);

  async function locate() {
    setLoading(true);
    setNote(null);

    const fetchFor = async (lat, lon, label) => {
      try {
        const { refuges: found } = await getRefuges(lat, lon);
        setRefuges(found);
        onRefuges?.(found);
        if (label) setNote(`Showing quiet spaces near ${label}.`);
      } catch (err) {
        setNote(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchFor(pos.coords.latitude, pos.coords.longitude, null),
        () => {
          const p = origin || DEFAULT_POINT;
          fetchFor(p.lat, p.lon, p.label || DEFAULT_POINT.label);
        },
        { timeout: 8000 }
      );
    } else {
      const p = origin || DEFAULT_POINT;
      fetchFor(p.lat, p.lon, p.label || DEFAULT_POINT.label);
    }
  }

  return (
    <section className="card refuge-card" aria-label="Quiet space now">
      <div className="refuge-card__head">
        <div>
          <h2>Quiet space now</h2>
          <p className="field-note">Nearest refuge, one tap.</p>
        </div>
        <button type="button" className="button button--secondary" onClick={locate}>
          {loading ? 'Finding…' : 'Find'}
        </button>
      </div>
      {note ? <p className="field-note">{note}</p> : null}
      {refuges ? (
        <ul className="refuge-list">
          {refuges.map((r) => (
            <li key={r.name}>
              <strong>{r.name}</strong>
              <span>
                {r.kind} · {r.distance_m} m · about {Math.max(1, Math.round(r.distance_m / 80))}{' '}
                min walk
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
