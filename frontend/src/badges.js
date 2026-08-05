/** Badge + flag logic, kept in one place. Threshold is the user's own number.
 *
 * AC 1.1.2: route average above threshold -> HIGH, otherwise LOW.
 * No average at all (no sensor data) -> NO DATA, never assumed calm.
 * Worst-point flag: only on true outliers — above the threshold AND more than
 * double the route's own average.
 */

export function routeBadge(route, threshold) {
  if (route.avg_density === null || route.avg_density === undefined) return 'NO DATA';
  return route.avg_density > threshold ? 'HIGH' : 'LOW';
}

export function worstIsFlagged(route, threshold) {
  if (!route.worst || route.avg_density === null) return false;
  return route.worst.value > threshold && route.worst.value > 2 * route.avg_density;
}

export function arrivalTime(durationMin) {
  const t = new Date(Date.now() + durationMin * 60_000);
  return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
