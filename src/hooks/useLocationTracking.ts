import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { Coordinates } from '../types';

type TrackingStatus = 'idle' | 'requesting' | 'tracking' | 'denied' | 'error';

type LocationTrackingResult = {
  location: Coordinates | null;
  accuracy: number | null;
  status: TrackingStatus;
  errorMessage: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
};

// Adaptif: lebih rapat saat berjalan pelan, lebih renggang saat bergerak cepat.
// Mengurangi update yang tidak diperlukan dan beban pemrosesan.
function getAdaptiveDistanceInterval(speedMetersPerSecond: number): number {
  if (speedMetersPerSecond > 4) return 15;
  if (speedMetersPerSecond > 1) return 10;
  return 5;
}

export function useLocationTracking(): LocationTrackingResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<TrackingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [distanceInterval, setDistanceInterval] = useState(10);
  const [trackingEnabled, setTrackingEnabled] = useState(false);

  const startTracking = useCallback(async () => {
    try {
      setStatus('requesting');
      setErrorMessage(null);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setStatus('error');
        setErrorMessage('Layanan lokasi perangkat sedang tidak aktif.');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        setErrorMessage('Izin lokasi ditolak. Aktifkan izin lokasi untuk memakai peta.');
        return;
      }

      setTrackingEnabled(true);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengaktifkan GPS.');
    }
  }, []);

  const stopTracking = useCallback(() => {
    setTrackingEnabled(false);
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (!trackingEnabled) return;

    let isActive = true;
    let subscription: Location.LocationSubscription | null = null;

    const subscribe = async () => {
      try {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval,
            timeInterval: 3000,
            mayShowUserSettingsDialog: true,
          },
          (position) => {
            if (!isActive) return;

            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setAccuracy(position.coords.accuracy ?? null);

            const nextInterval = getAdaptiveDistanceInterval(
              Math.max(0, position.coords.speed ?? 0),
            );
            setDistanceInterval((current) =>
              current === nextInterval ? current : nextInterval,
            );
            setStatus('tracking');
          },
        );
      } catch (error) {
        if (!isActive) return;
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Gagal membaca lokasi GPS.');
      }
    };

    void subscribe();

    return () => {
      isActive = false;
      subscription?.remove();
    };
  }, [trackingEnabled, distanceInterval]);

  return { location, accuracy, status, errorMessage, startTracking, stopTracking };
}
