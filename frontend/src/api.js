const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options) {
  let resp;
  try {
    resp = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      'We could not reach the route service. Check your connection and try again.'
    );
  }
  if (!resp.ok) {
    let detail;
    try {
      detail = (await resp.json()).detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail || 'Something went wrong on our side. Try again in a minute.');
  }
  return resp.json();
}

export function planRoutes(from, to) {
  return request('/api/routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { lat: from.lat, lon: from.lon, label: from.label },
      to: { lat: to.lat, lon: to.lon, label: to.label },
    }),
  });
}

export function getStatus() {
  return request('/api/status');
}

export function geocode(text) {
  return request(`/api/geocode?text=${encodeURIComponent(text)}`);
}

export function getRefuges(lat, lon, limit = 3) {
  return request(`/api/refuges?lat=${lat}&lon=${lon}&limit=${limit}`);
}
