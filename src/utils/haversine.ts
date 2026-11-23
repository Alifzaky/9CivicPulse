import type { Coordinates } from '../types';

const EARTH_RADIUS_METERS = 6_371_000;

/** Menghitung jarak garis lurus antara dua koordinat GPS dalam meter. */
export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  const clampedA = Math.min(1, Math.max(0, a));
  const centralAngle = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_METERS * centralAngle;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return 'Jarak tidak tersedia';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}
