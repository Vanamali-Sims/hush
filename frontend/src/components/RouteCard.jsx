import { useState } from 'react';
import { arrivalTime, routeBadge, worstIsFlagged } from '../badges';

function Badge({ kind }) {
  const cls = { LOW: 'badge badge--low', HIGH: 'badge badge--high' }[kind] || 'badge badge--nodata';
  return <span className={cls}>{kind}</span>;
}

export function RouteCard({ route, threshold, selected, onSelect }) {
  const [showWorst, setShowWorst] = useState(false);
  const badge = routeBadge(route, threshold);
  const flagged = worstIsFlagged(route, threshold);

  return (
    <article
      className={`route-card${selected ? ' route-card--selected' : ''}`}
      aria-current={selected ? 'true' : undefined}
    >
      <button type="button" className="route-card__main" onClick={onSelect}>
        <div className="route-card__title-row">
          <h3>{route.via ? `Via ${route.via}` : 'Walking route'}</h3>
          <Badge kind={badge} />
        </div>
        <p className="route-card__meta">
          {route.duration_min} min · arrives {arrivalTime(route.duration_min)}
        </p>
        {route.avg_density !== null ? (
          <p className="route-card__density">
            <strong>{Math.round(route.avg_density)}</strong> people/min — average across
            matched sensors.{' '}
            {badge === 'LOW'
              ? `At or below your limit of ${threshold}.`
              : `Above your limit of ${threshold}.`}
          </p>
        ) : (
          <p className="route-card__density">
            No sensor close enough to this route to measure it. Not assumed calm.
          </p>
        )}
        {route.segments_no_data > 0 && route.avg_density !== null ? (
          <p className="nodata-chip">
            {route.segments_no_data} of {route.segments_total} segments — no sensor
            within 50 m
          </p>
        ) : null}
      </button>

      {route.worst ? (
        <div className="route-card__worst">
          <button
            type="button"
            className="disclosure"
            aria-expanded={showWorst}
            onClick={() => setShowWorst((v) => !v)}
          >
            Worst point on this route {flagged ? <span className="flag">!</span> : null}
            <span className="disclosure__hint">{showWorst ? 'Hide' : 'Show'}</span>
          </button>
          {showWorst ? (
            <div className="worst-panel">
              <p>
                <strong>{Math.round(route.worst.value)} people/min</strong> —{' '}
                {route.worst.street}
              </p>
              <p>
                {flagged
                  ? `More than double this route's average, and above your ${threshold}/min limit. ` +
                    `The badge stays ${badge} — the average still describes the whole trip.`
                  : route.worst.value > threshold
                    ? `Above your ${threshold}/min limit, but close to this route's average.`
                    : `Below your ${threshold}/min limit.`}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
