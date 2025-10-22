const toRad = (deg) => (Math.PI * deg) / 180;
const toDeg = (rad) => (180 * rad) / Math.PI;

/**
 * Calcula la distancia en metros entre dos puntos usando Haversine
 */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcula el bearing inicial en grados de A hacia B
 */
export function initialBearingDeg(lat1, lon1, lat2, lon2) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Calcula la diferencia angular mínima entre dos ángulos (0-180°)
 */
export function angleDiffDeg(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/**
 * Verifica si dos conos de sectores se intersectan
 * @param {Object} a - Sector A con {lat, lng, az}
 * @param {Object} b - Sector B con {lat, lng, az}
 * @param {number} maxDist - Distancia máxima en metros (default: 600)
 * @param {number} halfConeDeg - Mitad del ángulo del cono en grados (default: 5)
 */
export function conesIntersect(a, b, maxDist = 600, halfConeDeg = 5) {
  // 1. Verificar distancia
  const dist = haversineMeters(a.lat, a.lng, b.lat, b.lng);
  if (dist > maxDist) return false;

  // 2. Calcular bearings
  const bearingAB = initialBearingDeg(a.lat, a.lng, b.lat, b.lng);
  const bearingBA = initialBearingDeg(b.lat, b.lng, a.lat, a.lng);

  // 3. Verificar si A apunta hacia B y B apunta hacia A
  const aPointsToB = angleDiffDeg(a.az, bearingAB) <= halfConeDeg;
  const bPointsToA = angleDiffDeg(b.az, bearingBA) <= halfConeDeg;

  return aPointsToB && bPointsToA;
}

/**
 * Calcula el punto destino dado un punto inicial, bearing y distancia
 */
export function destinationPoint(lat, lon, bearingDeg, distMeters) {
  const R = 6371000;
  const δ = distMeters / R;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return {
    lat: toDeg(φ2),
    lng: ((toDeg(λ2) + 540) % 360) - 180,
  };
}

/**
 * Construye una clave de celda para indexación espacial
 * Celda de ~1.1 km (ajustable)
 */
export function buildGridKey(lat, lng, scale = 100) {
  return `${Math.floor(lat * scale)}:${Math.floor(lng * scale)}`;
}
