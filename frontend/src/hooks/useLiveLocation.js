import { useEffect, useRef, useState } from 'react';

/** Continuously-updating device position (the "you are here" map dot).
 * Off by default — starts only when start() is called, stops on stop() or
 * unmount. Separate from the one-shot "Use my current location" lookup. */
export function useLiveLocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef(null);

  useEffect(() => {
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function start() {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location.');
      return;
    }
    setError(null);
    setTracking(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          heading: Number.isFinite(pos.coords.heading) ? pos.coords.heading : null,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        setError('We lost your location. Nothing else is affected.');
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTracking(false);
  }

  return { position, error, tracking, start, stop };
}
