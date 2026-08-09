import { QuietIcon } from './icons';

/** "Quiet space now" — nearest low-stimulation refuges, shown automatically,
 * no click required to see them. Purely presentational: App.jsx owns the
 * fetch, since the map on this screen needs the same data. */
export function RefugePanel({ refuges, loading, note, onPlanRoute, onRefresh }) {
  return (
    <section className="card refuge-card" aria-label="Quiet spaces near you">
      <div className="refuge-card__head">
        <div>
          <h2 className="heading-with-icon">
            <QuietIcon size={20} />
            Quiet spaces near you
          </h2>
          <p className="field-note">Tap a place, or a marker on the map, for directions.</p>
        </div>
        <button type="button" className="button button--secondary" onClick={onRefresh}>
          {loading ? 'Finding…' : 'Refresh'}
        </button>
      </div>
      {note ? <p className="field-note">{note}</p> : null}
      {loading && !refuges ? (
        <p className="status-live" role="status" aria-live="polite">
          Finding quiet spaces near you…
        </p>
      ) : null}
      {refuges ? (
        <ul className="refuge-list">
          {refuges.map((r) => (
            <li key={r.name}>
              <strong>{r.name}</strong>
              <span>
                {r.kind} · {r.distance_m} m · about{' '}
                {Math.max(1, Math.round(r.distance_m / 80))} min walk
              </span>
              <button
                type="button"
                className="link-button"
                onClick={() => onPlanRoute?.({ label: r.name, lat: r.lat, lon: r.lon })}
              >
                Take me there
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
