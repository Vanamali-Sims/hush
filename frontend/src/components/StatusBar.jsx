import { ClockIcon } from './icons';

/** Honest data-freshness line. Always visible once known. */
export function StatusBar({ data }) {
  if (!data) return null;
  const age = data.age_min;
  const ageText =
    age === null || age === undefined
      ? ''
      : age < 1
        ? 'updated just now'
        : `updated ${age} min ago`;

  const sourceText = {
    database: 'Pedestrian data: synced feed',
    live: 'Pedestrian data: live feed',
    snapshot: 'Pedestrian data: saved copy (the live feed is not available right now)',
  }[data.source];

  return (
    <p className={`status-bar${data.source === 'snapshot' ? ' status-bar--stale' : ''}`}>
      <ClockIcon size={16} />
      <span>
        {sourceText}
        {ageText ? ` · ${ageText}` : ''}
      </span>
    </p>
  );
}
