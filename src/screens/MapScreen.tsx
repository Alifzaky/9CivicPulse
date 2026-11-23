import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportMarker } from '../components/ReportMarker';
import { MOCK_REPORTS } from '../data/mockReports';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useCivicStore } from '../store/useCivicStore';
import type { CivicReport } from '../types';
import { formatDistance, haversineDistance } from '../utils/haversine';

const DEFAULT_REGION = {
  latitude: -7.2575,
  longitude: 112.7521,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export default function MapScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { location, accuracy, status, errorMessage, startTracking } = useLocationTracking();

  // Precision selectors: komponen hanya subscribe pada state yang dibutuhkan.
  const reports = useCivicStore((state) => state.reports);
  const selectedReportId = useCivicStore((state) => state.selectedReportId);
  const setReports = useCivicStore((state) => state.setReports);
  const selectReport = useCivicStore((state) => state.selectReport);

  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setReports(MOCK_REPORTS);
  }, [setReports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const distanceLabel = useMemo(() => {
    if (!location || !selectedReport) return null;
    const meters = haversineDistance(location, {
      latitude: selectedReport.latitude,
      longitude: selectedReport.longitude,
    });
    return formatDistance(meters);
  }, [location, selectedReport]);

  const handleMarkerPress = useCallback(
    (report: CivicReport) => selectReport(report.id),
    [selectReport],
  );

  const initialRegion = location
    ? { ...location, latitudeDelta: 0.012, longitudeDelta: 0.012 }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CIVIC PULSE</Text>
          <Text style={styles.heading}>Peta Laporan Warga</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{reports.length} laporan</Text>
        </View>
      </View>

      <View style={[styles.mapContainer, isLandscape && styles.mapLandscape]}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          onMapReady={() => setMapReady(true)}
          mapType="standard"
        >
          {reports.map((report) => (
            <ReportMarker key={report.id} report={report} onPress={handleMarkerPress} />
          ))}

          {location && (
            <Circle
              center={location}
              radius={Math.max(accuracy ?? 20, 10)}
              strokeColor="rgba(37, 99, 235, 0.65)"
              fillColor="rgba(37, 99, 235, 0.12)"
            />
          )}
        </MapView>

        {!mapReady && (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.mutedText}>Memuat peta...</Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelTopRow}>
          <Text style={styles.panelTitle}>Status lokasi</Text>
          <Text style={styles.statusText}>
            {status === 'tracking' ? 'GPS aktif' : status === 'denied' ? 'Izin ditolak' : 'Belum aktif'}
          </Text>
        </View>

        {location ? (
          <Text style={styles.coordinateText}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            {accuracy !== null ? `  •  ±${Math.round(accuracy)} m` : ''}
          </Text>
        ) : (
          <Text style={styles.mutedText}>Aktifkan GPS untuk mendapatkan koordinat perangkat.</Text>
        )}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Aktifkan pelacakan lokasi"
          onPress={startTracking}
          style={({ pressed }) => [styles.locationButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.locationButtonText}>
            {status === 'tracking' ? 'Perbarui layanan lokasi' : 'Aktifkan lokasi'}
          </Text>
        </Pressable>
      </View>

      {selectedReport && (
        <View style={styles.reportCard}>
          <View style={styles.panelTopRow}>
            <Text style={styles.panelTitle}>{selectedReport.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup detail laporan"
              onPress={() => selectReport(null)}
            >
              <Text style={styles.closeText}>Tutup</Text>
            </Pressable>
          </View>
          <Text style={styles.mutedText}>{selectedReport.description}</Text>
          <Text style={styles.distanceText}>
            {distanceLabel ? `Jarak dari lokasi Anda: ${distanceLabel}` : 'Aktifkan GPS untuk menghitung jarak.'}
          </Text>
          <Text style={styles.reportMeta}>
            ID {selectedReport.id}  •  Status: {selectedReport.status}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F9FC' },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { color: '#2563EB', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heading: { color: '#14213D', fontSize: 21, fontWeight: '800', marginTop: 3 },
  countBadge: { backgroundColor: '#E8F0FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  countText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  mapContainer: { flex: 1, marginHorizontal: 12, borderRadius: 18, overflow: 'hidden', minHeight: 260 },
  mapLandscape: { minHeight: 180 },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247,249,252,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    padding: 15,
    borderRadius: 16,
    gap: 8,
  },
  panelTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 15, color: '#14213D', fontWeight: '800', flexShrink: 1 },
  statusText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  coordinateText: { color: '#334155', fontSize: 12 },
  mutedText: { color: '#64748B', fontSize: 12, lineHeight: 18 },
  errorText: { color: '#B91C1C', fontSize: 12 },
  locationButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 3,
  },
  buttonPressed: { opacity: 0.78 },
  locationButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  reportCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 15,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  closeText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  distanceText: { color: '#1D4ED8', fontSize: 13, fontWeight: '700' },
  reportMeta: { color: '#94A3B8', fontSize: 10 },
});
