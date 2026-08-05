import { useEffect, useState } from 'react';
import { getStatus, planRoutes } from './api';
import { useLocalStorage } from './hooks/useLocalStorage';
import { PlaceField } from './components/PlaceField';
import { ThresholdControl } from './components/ThresholdControl';
import { RouteCard } from './components/RouteCard';
import { MapView } from './components/MapView';
import { Legend } from './components/Legend';
import { StatusBar } from './components/StatusBar';
import { RefugePanel } from './components/RefugePanel';

export default function App() {
  const [threshold, setThreshold] = useLocalStorage('hush-threshold', 100);
  const [favourites, setFavourites] = useLocalStorage('hush-favourites', []);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [refuges, setRefuges] = useState(null);

  useEffect(() => {
    getStatus()
      .then((s) =>
        setStatus({ source: s.data_source, age_min: s.data_age_min })
      )
      .catch(() => {});
  }, []);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location. Type a place instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setFrom({
          label: 'Current location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      () =>
        setError(
          'We could not read your location. Nothing is wrong — just type a starting place instead.'
        ),
      { timeout: 8000 }
    );
  }

  async function findRoutes(e) {
    e.preventDefault();
    setError(null);
    if (!from || !to) {
      setError('Choose both a starting place and a destination from the suggestions.');
      return;
    }
    setLoading(true);
    try {
      const res = await planRoutes(from, to);
      setResult(res);
      setSelectedId(res.routes[0]?.id ?? null);
      setStatus(res.data ? { source: res.data.source, age_min: res.data.age_min } : status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function saveFavourite(place) {
    if (!place) return;
    setFavourites((prev) =>
      prev.some((p) => p.label === place.label) ? prev : [...prev, place].slice(-8)
    );
  }

  function removeFavourite(label) {
    setFavourites((prev) => prev.filter((p) => p.label !== label));
  }

  const hasRoutes = result && result.routes.length > 0;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <span className="logo">hush</span>
          <span className="logo-sub">Sensory-aware wayfinding · Melbourne CBD</span>
        </div>
        <ThresholdControl threshold={threshold} onChange={setThreshold} />
      </header>

      <StatusBar data={status} />

      <main className="layout">
        <div className="layout__panel">
          <section className="card" aria-label="Plan a trip">
            <h1>Plan a trip</h1>
            <form onSubmit={findRoutes}>
              <PlaceField
                id="from"
                label="From"
                value={from}
                onSelect={setFrom}
                onUseCurrentLocation={useCurrentLocation}
                tag={from?.label === 'Current location' ? 'Current location' : null}
              />
              <PlaceField id="to" label="To" value={to} onSelect={setTo} />

              {favourites.length > 0 ? (
                <div className="favourites">
                  <p className="field-note">Saved places (kept on this device):</p>
                  <ul>
                    {favourites.map((p) => (
                      <li key={p.label}>
                        <button
                          type="button"
                          className="chip"
                          onClick={() => (from ? setTo(p) : setFrom(p))}
                          title={from ? 'Use as destination' : 'Use as start'}
                        >
                          {p.label}
                        </button>
                        <button
                          type="button"
                          className="chip chip--remove"
                          aria-label={`Remove ${p.label} from saved places`}
                          onClick={() => removeFavourite(p.label)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button type="submit" className="button" disabled={loading}>
                {loading ? 'Finding calmer routes…' : 'Find calmer routes'}
              </button>

              {to ? (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => saveFavourite(to)}
                >
                  Save “{to.label}” to this device
                </button>
              ) : null}
            </form>
          </section>

          {error ? (
            <div className="notice" role="alert">
              <p>{error}</p>
            </div>
          ) : null}

          {hasRoutes ? (
            <section className="card" aria-label="Route results">
              <div className="results-head">
                <h2>
                  {result.routes.length}{' '}
                  {result.routes.length === 1 ? 'route' : 'routes'}
                </h2>
                <p className="field-note">
                  Sorted by arrival. All routes are shown — none are hidden from you.
                </p>
                {result.route_source === 'fallback' ? (
                  <p className="field-note">
                    The live route service is down, so these are recently saved routes
                    for this trip.
                  </p>
                ) : null}
              </div>
              {result.routes.map((r) => (
                <RouteCard
                  key={r.id}
                  route={r}
                  threshold={threshold}
                  selected={selectedId === r.id}
                  onSelect={() => setSelectedId(r.id)}
                />
              ))}
            </section>
          ) : null}

          {result && result.routes.length === 0 ? (
            <div className="notice">
              <p>
                No walking route was found between those places. Try places a little
                further apart, inside the CBD.
              </p>
            </div>
          ) : null}

          <RefugePanel origin={from} onRefuges={setRefuges} />
        </div>

        <div className="layout__map">
          <MapView
            routes={result?.routes}
            threshold={threshold}
            selectedId={selectedId}
            onSelect={setSelectedId}
            from={from}
            to={to}
            refuges={refuges}
          />
          {hasRoutes ? <Legend threshold={threshold} /> : null}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Routes from OpenRouteService (up to 3 alternatives). Sensory scores from the
          City of Melbourne Pedestrian Counting System. Scoring covers the CBD sensor
          network — places without sensors are marked “no data”, never assumed calm.
        </p>
      </footer>
    </div>
  );
}
