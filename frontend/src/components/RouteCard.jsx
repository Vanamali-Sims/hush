import { useState } from 'react';
import { arrivalTime, routeBadge, worstIsFlagged } from '../badges';
import { CautionIcon, DashIcon, LeafIcon } from './icons';

function Badge({ kind }) {
  const cls =
    { LOW: 'badge badge--low', HIGH: 'badge badge--high' }[kind] || 'badge badge--nodata';
  const Icon = { LOW: LeafIcon, HIGH: CautionIcon }[kind] || DashIcon;
  return (
    <span className={cls}>
      <Icon size={15} />
      {kind}
    </span>
  );
}

export function RouteCard({
  route,
  threshold,
  selected,
  calmest,
  onSelect,
  journeyAvailable,
  journeying,
  onStartJourney,
  onStopJourney,
  journeyNotice,
}) {
  const [showWorst, setShowWorst] = useState(false);
  const badge = routeBadge(route, threshold);
  const flagged = worstIsFlagged(route, threshold);

  const className = [
    'route-card',
    calmest ? 'route-card--calmest' : '',
    !calmest ? 'route-card--muted' : '',
    selected ? 'route-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className} aria-current={selected ? 'true' : undefined}>
      {calmest ? (
        <p className="route-card__calmest-tag">
          <LeafIcon size={16} />
          Calmest of these
        </p>
      ) : null}
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
            {route.segments_no_data} of {route.segments_total} segments — no sensor within
            50 m
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

      {selected && journeyAvailable ? (
        <div className="route-card__journey">
          {journeying ? (
            <button type="button" className="button button--secondary" onClick={onStopJourney}>
              Stop navigating
            </button>
          ) : (
            <button type="button" className="button" onClick={onStartJourney}>
              Start
            </button>
          )}
          {journeyNotice ? <p className="field-note">{journeyNotice}</p> : null}
        </div>
      ) : null}
      {selected && !journeyAvailable ? (
        <div className="route-card__journey">
          <p className="field-note">
            Start is only available when this trip begins at your current location —
            plan from &ldquo;Use my current location&rdquo; to turn-by-turn this route.
          </p>
        </div>
      ) : null}
    </article>
  );
}
