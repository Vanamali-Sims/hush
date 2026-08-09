import { useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Map, Marker, Source } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { routeBadge, worstIsFlagged } from '../badges';
import { LocateIcon } from './icons';

const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE || 'https://tiles.openfreemap.org/styles/positron';

// Muted route colours — calm, never alarm-red. Selected route is wider, not brighter.
const COLORS = { LOW: '#5F8268', HIGH: '#B0793F', 'NO DATA': '#8F8B82' };

const MELBOURNE_CENTER = { longitude: 144.9646, latitude: -37.8136, zoom: 14 };

export function MapView({
  routes,
  threshold,
  selectedId,
  onSelect,
  from,
  to,
  liveLocation,
  liveLocationTracking,
  onToggleLiveLocation,
  journeyActive,
  refuges,
  onPlanRouteToRefuge,
}) {
  const mapRef = useRef(null);
  const [selectedRefuge, setSelectedRefuge] = useState(null);

  const routesGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: (routes || []).map((r) => ({
        type: 'Feature',
        geometry: r.geometry,
        properties: { id: r.id, color: COLORS[routeBadge(r, threshold)] },
      })),
    }),
    [routes, threshold],
  );

  const selected = (routes || []).find((r) => r.id === selectedId);

  const sensorsGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: (selected?.matched_sensors || []).map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
        properties: { reading: s.reading },
      })),
    }),
    [selected],
  );

  // Fit the view to the routes without animation (no sudden motion).
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !routes || routes.length === 0) return;
    let minLon = Infinity,
      minLat = Infinity,
      maxLon = -Infinity,
      maxLat = -Infinity;
    for (const r of routes) {
      for (const [lon, lat] of r.geometry.coordinates) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
    }
    map.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 56, duration: 0 },
    );
  }, [routes]);

  // Fit the view to the refuge markers (+ the origin point) without
  // animation. Without this the map just sits at its fixed default centre,
  // which only happens to include the markers if the user is already near
  // the middle of the CBD — everywhere else they'd render off-screen.
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !refuges || refuges.length === 0) return;
    const points = [...refuges.map((r) => [r.lon, r.lat])];
    if (from) points.push([from.lon, from.lat]);
    let minLon = Infinity,
      minLat = Infinity,
      maxLon = -Infinity,
      maxLat = -Infinity;
    for (const [lon, lat] of points) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
    map.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding: 64, duration: 0, maxZoom: 17 },
    );
  }, [refuges, from]);

  // Journey mode: keep the device's live position centred as it updates.
  // jumpTo, not flyTo/easeTo — an instant snap, not a sliding animation.
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || !journeyActive || !liveLocation) return;
    map.jumpTo({ center: [liveLocation.lon, liveLocation.lat] });
  }, [journeyActive, liveLocation]);

  return (
    <div className="map-shell">
      <button
        type="button"
        className={`locate-btn${liveLocationTracking ? ' locate-btn--active' : ''}`}
        onClick={onToggleLiveLocation}
        aria-pressed={liveLocationTracking}
        title={liveLocationTracking ? 'Stop showing my location' : 'Show my location on the map'}
      >
        <LocateIcon size={19} />
      </button>
      <Map
        ref={mapRef}
        initialViewState={MELBOURNE_CENTER}
        mapStyle={MAP_STYLE}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        attributionControl={{ compact: true }}
        onClick={(e) => {
          const map = mapRef.current?.getMap?.();
          if (!map || !routes?.length) return;
          const hit = map.queryRenderedFeatures(e.point, { layers: ['routes-line'] })[0];
          if (hit) onSelect(hit.properties.id);
        }}
      >
        {routes && routes.length > 0 ? (
          <Source id="routes" type="geojson" data={routesGeoJson}>
            <Layer
              id="routes-line"
              type="line"
              layout={{ 'line-cap': 'round', 'line-join': 'round' }}
              paint={{
                'line-color': ['get', 'color'],
                'line-width': ['case', ['==', ['get', 'id'], selectedId ?? -1], 6, 3],
                'line-opacity': [
                  'case',
                  ['==', ['get', 'id'], selectedId ?? -1],
                  0.95,
                  0.45,
                ],
              }}
            />
          </Source>
        ) : null}

        {selected ? (
          <Source id="sensors" type="geojson" data={sensorsGeoJson}>
            <Layer
              id="sensors-dots"
              type="circle"
              paint={{
                'circle-radius': 4,
                'circle-color': '#6D6A62',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#F6F4EF',
              }}
            />
          </Source>
        ) : null}

        {from ? (
          <Marker longitude={from.lon} latitude={from.lat} anchor="bottom">
            <div className="map-pin">
              <span className="map-pin__dot" />
              <span className="map-pin__label">{from.label}</span>
            </div>
          </Marker>
        ) : null}
        {to ? (
          <Marker longitude={to.lon} latitude={to.lat} anchor="bottom">
            <div className="map-pin">
              <span className="map-pin__dot map-pin__dot--dest" />
              <span className="map-pin__label">{to.label}</span>
            </div>
          </Marker>
        ) : null}

        {liveLocation ? (
          <Marker longitude={liveLocation.lon} latitude={liveLocation.lat} anchor="center">
            <div className="you-are-here" aria-label="Your current location">
              <span className="you-are-here__pulse" />
              <span className="you-are-here__dot" />
            </div>
          </Marker>
        ) : null}

        {(refuges || []).map((r) => (
          <Marker key={r.name} longitude={r.lon} latitude={r.lat} anchor="bottom">
            <button
              type="button"
              className="map-pin-btn"
              onClick={() => setSelectedRefuge(r)}
              aria-label={`${r.name}, ${r.kind}`}
            >
              <span className="map-pin">
                <span className="map-pin__dot map-pin__dot--refuge" />
                <span className="map-pin__label">{r.name}</span>
              </span>
            </button>
          </Marker>
        ))}

        {selectedRefuge ? (
          <Marker longitude={selectedRefuge.lon} latitude={selectedRefuge.lat} anchor="top">
            <div className="refuge-callout">
              <strong>{selectedRefuge.name}</strong>
              <span>{selectedRefuge.kind}</span>
              <div className="refuge-callout__actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() =>
                    onPlanRouteToRefuge?.({
                      label: selectedRefuge.name,
                      lat: selectedRefuge.lat,
                      lon: selectedRefuge.lon,
                    })
                  }
                >
                  Take me there
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setSelectedRefuge(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </Marker>
        ) : null}

        {selected?.worst && worstIsFlagged(selected, threshold) ? (
          <Marker
            longitude={selected.worst.lon}
            latitude={selected.worst.lat}
            anchor="left"
          >
            <div className="worst-callout">
              <strong>{Math.round(selected.worst.value)} people/min</strong>
              <span>{selected.worst.street}</span>
            </div>
          </Marker>
        ) : null}
      </Map>
    </div>
  );
}
