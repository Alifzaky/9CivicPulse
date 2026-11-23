
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import MapView, {
  Circle,
  Heatmap,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ReportMarker } from '../components/ReportMarker';
import { MOCK_REPORTS } from '../data/mockReports';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useCivicStore } from '../store/useCivicStore';

import type { CivicReport, Coordinates } from '../types';

import {
  formatDistance,
  haversineDistance,
} from '../utils/haversine';

interface MapScreenProps {
  onCreateReport: () => void;
}

const DEFAULT_REGION = {
  latitude: -7.2575,
  longitude: 112.7521,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapSize = {
  width: number;
  height: number;
};

type ReportGroup = {
  reports: CivicReport[];
  coordinate: Coordinates;
};

type MapDisplayMode = 'pins' | 'heatmap' | 'both';

const CLUSTER_DISTANCE = 48;

function clusterReports(
  reports: CivicReport[],
  region: MapRegion,
  size: MapSize,
): ReportGroup[] {
  if (size.width <= 0 || size.height <= 0) {
    return reports.map((report) => ({
      reports: [report],
      coordinate: {
        latitude: report.latitude,
        longitude: report.longitude,
      },
    }));
  }

  const positions = reports.map((report) => ({
    x:
      ((report.longitude - region.longitude) /
        region.longitudeDelta) *
      size.width,
    y:
      ((region.latitude - report.latitude) /
        region.latitudeDelta) *
      size.height,
  }));
  const parents = reports.map((_, index) => index);
  const findRoot = (index: number): number => {
    let root = index;
    while (parents[root] !== root) {
      root = parents[root];
    }
    while (parents[index] !== index) {
      const next = parents[index];
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const join = (first: number, second: number) => {
    const firstRoot = findRoot(first);
    const secondRoot = findRoot(second);
    if (firstRoot !== secondRoot) {
      parents[secondRoot] = firstRoot;
    }
  };
  const cells = new Map<string, number[]>();

  positions.forEach((position, index) => {
    const cellX = Math.floor(position.x / CLUSTER_DISTANCE);
    const cellY = Math.floor(position.y / CLUSTER_DISTANCE);

    for (let x = cellX - 1; x <= cellX + 1; x += 1) {
      for (let y = cellY - 1; y <= cellY + 1; y += 1) {
        for (const neighbor of cells.get(`${x}:${y}`) ?? []) {
          const dx = position.x - positions[neighbor].x;
          const dy = position.y - positions[neighbor].y;
          if (dx * dx + dy * dy <= CLUSTER_DISTANCE ** 2) {
            join(index, neighbor);
          }
        }
      }
    }

    const key = `${cellX}:${cellY}`;
    const cell = cells.get(key);
    if (cell) {
      cell.push(index);
    } else {
      cells.set(key, [index]);
    }
  });

  const groups = new Map<number, CivicReport[]>();
  reports.forEach((report, index) => {
    const root = findRoot(index);
    const group = groups.get(root);
    if (group) {
      group.push(report);
    } else {
      groups.set(root, [report]);
    }
  });

  return Array.from(groups.values()).map((group) => ({
    reports: group,
    coordinate: {
      latitude:
        group.reduce((sum, report) => sum + report.latitude, 0) /
        group.length,
      longitude:
        group.reduce((sum, report) => sum + report.longitude, 0) /
        group.length,
    },
  }));
}

export default function MapScreen({
  onCreateReport,
}: MapScreenProps) {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const {
    location,
    accuracy,
    status,
    errorMessage,
    startTracking,
  } = useLocationTracking();

  // Precision selectors Zustand.
  const reports = useCivicStore((state) => state.reports);
  const selectedReportId = useCivicStore(
    (state) => state.selectedReportId,
  );

  const setReports = useCivicStore(
    (state) => state.setReports,
  );

  const selectReport = useCivicStore(
    (state) => state.selectReport,
  );

  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] =
    useState<MapRegion>(DEFAULT_REGION);
  const [mapSize, setMapSize] = useState<MapSize>({
    width: 0,
    height: 0,
  });
  const [displayMode, setDisplayMode] =
    useState<MapDisplayMode>('pins');
  const mapRef = useRef<MapView | null>(null);

  // Inisialisasi laporan.
  useEffect(() => {
    setReports(MOCK_REPORTS);
  }, [setReports]);

  // Mengambil laporan yang sedang dipilih.
  const selectedReport = useMemo(
    () =>
      reports.find(
        (report) => report.id === selectedReportId,
      ) ?? null,
    [reports, selectedReportId],
  );

  // Menghitung jarak pengguna ke laporan.
  const distanceLabel = useMemo(() => {
    if (!location || !selectedReport) {
      return null;
    }

    const meters = haversineDistance(location, {
      latitude: selectedReport.latitude,
      longitude: selectedReport.longitude,
    });

    return formatDistance(meters);
  }, [location, selectedReport]);

  // Callback marker.
  const handleMarkerPress = useCallback(
    (report: CivicReport) => {
      selectReport(report.id);
    },
    [selectReport],
  );

  const reportGroups = useMemo(
    () => clusterReports(reports, mapRegion, mapSize),
    [mapRegion, mapSize, reports],
  );

  const heatmapPoints = useMemo(
    () =>
      reports.map((report) => {
        const active = report.status !== 'resolved';
        const supportCount = Math.max(
          0,
          report.jumlah_dukungan ?? 1,
        );

        return {
          latitude: report.latitude,
          longitude: report.longitude,
          weight:
            Math.log2(supportCount + 1) * (active ? 2 : 0.5),
        };
      }),
    [reports],
  );

  const handleClusterPress = useCallback(
    (group: ReportGroup) => {
      if (group.reports.length < 2) {
        return;
      }

      const pixelPositions = group.reports.map((report) => ({
        x:
          ((report.longitude - mapRegion.longitude) /
            mapRegion.longitudeDelta) *
          mapSize.width,
        y:
          ((mapRegion.latitude - report.latitude) /
            mapRegion.latitudeDelta) *
          mapSize.height,
      }));
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let first = 0; first < pixelPositions.length; first += 1) {
        for (
          let second = first + 1;
          second < pixelPositions.length;
          second += 1
        ) {
          const dx =
            pixelPositions[first].x - pixelPositions[second].x;
          const dy =
            pixelPositions[first].y - pixelPositions[second].y;
          nearestDistance = Math.min(
            nearestDistance,
            Math.sqrt(dx * dx + dy * dy),
          );
        }
      }

      const zoomFactor =
        nearestDistance > 0 && Number.isFinite(nearestDistance)
          ? Math.min(0.5, (nearestDistance / 70) * 0.8)
          : 0.25;

      mapRef.current?.animateToRegion(
        {
          ...group.coordinate,
          latitudeDelta: Math.max(
            mapRegion.latitudeDelta * zoomFactor,
            0.0001,
          ),
          longitudeDelta: Math.max(
            mapRegion.longitudeDelta * zoomFactor,
            0.0001,
          ),
        },
        350,
      );
    },
    [mapRegion, mapSize],
  );

  // Wilayah awal peta.
  const initialRegion = location
    ? {
        ...location,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }
    : DEFAULT_REGION;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            CIVIC PULSE
          </Text>

          <Text style={styles.heading}>
            Peta Laporan Warga
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {reports.length} laporan
          </Text>
        </View>
      </View>

      {/* INTERACTIVE MAP */}
      <View
        style={[
          styles.mapContainer,
          isLandscape && styles.mapLandscape,
        ]}
        onLayout={(event) =>
          setMapSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }
      >
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          onMapReady={() => setMapReady(true)}
          onRegionChangeComplete={setMapRegion}
          mapType="standard"
        >
          {(displayMode === 'heatmap' || displayMode === 'both') && (
            <Heatmap
              points={heatmapPoints}
              radius={36}
              opacity={0.75}
              gradient={{
                colors: [
                  '#2563EB',
                  '#22C55E',
                  '#FACC15',
                  '#B91C1C',
                ],
                startPoints: [0, 0.3, 0.65, 1],
                colorMapSize: 256,
              }}
            />
          )}

          {(displayMode === 'pins' || displayMode === 'both') &&
            reportGroups.map((group) =>
              group.reports.length === 1 ? (
                <ReportMarker
                  key={group.reports[0].id}
                  report={group.reports[0]}
                  onPress={handleMarkerPress}
                />
              ) : (
                <Marker
                  key={group.reports.map((report) => report.id).join('-')}
                  coordinate={group.coordinate}
                  onPress={() => handleClusterPress(group)}
                  tracksViewChanges={false}
                  accessibilityLabel={`${group.reports.length} laporan dalam cluster`}
                >
                  <View style={styles.clusterMarker}>
                    <Text style={styles.clusterCount}>
                      {group.reports.length}
                    </Text>
                  </View>
                </Marker>
              ),
            )}

          {location && (
            <Circle
              center={location}
              radius={Math.max(accuracy ?? 20, 10)}
              strokeColor="rgba(37, 99, 235, 0.65)"
              fillColor="rgba(37, 99, 235, 0.12)"
            />
          )}
        </MapView>

        <View
          accessibilityLabel="Pilih tampilan peta"
          style={styles.displayControl}
        >
          {(
            [
              ['pins', 'Pin (Cluster)'],
              ['heatmap', 'Heatmap'],
              ['both', 'Keduanya'],
            ] as const
          ).map(([mode, label]) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: displayMode === mode }}
              onPress={() => setDisplayMode(mode)}
              style={[
                styles.displayOption,
                displayMode === mode && styles.displayOptionSelected,
              ]}
            >
              <Text
                style={[
                  styles.displayOptionText,
                  displayMode === mode &&
                    styles.displayOptionTextSelected,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {!mapReady && (
          <View style={styles.mapLoading}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text style={styles.mutedText}>
              Memuat peta...
            </Text>
          </View>
        )}
      </View>

      {/* LOCATION PANEL */}
      <View style={styles.panel}>
        <View style={styles.panelTopRow}>
          <Text style={styles.panelTitle}>
            Status lokasi
          </Text>

          <Text style={styles.statusText}>
            {status === 'tracking'
              ? 'GPS aktif'
              : status === 'denied'
                ? 'Izin ditolak'
                : 'Belum aktif'}
          </Text>
        </View>

        {location ? (
          <Text style={styles.coordinateText}>
            {location.latitude.toFixed(6)},{' '}
            {location.longitude.toFixed(6)}
            {accuracy !== null
              ? `  •  ±${Math.round(accuracy)} m`
              : ''}
          </Text>
        ) : (
          <Text style={styles.mutedText}>
            Aktifkan GPS untuk mendapatkan koordinat perangkat.
          </Text>
        )}

        {errorMessage ? (
          <Text style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}

        {/* GPS BUTTON */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Aktifkan pelacakan lokasi"
          onPress={startTracking}
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.locationButtonText}>
            {status === 'tracking'
              ? 'Perbarui layanan lokasi'
              : 'Aktifkan lokasi'}
          </Text>
        </Pressable>

        {/* CREATE REPORT BUTTON */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buat laporan baru"
          accessibilityHint="Membuka formulir pembuatan laporan warga"
          onPress={onCreateReport}
          style={({ pressed }) => [
            styles.createReportButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.createReportButtonText}>
            + Buat Laporan
          </Text>
        </Pressable>
      </View>

      {/* REPORT DETAIL */}
      {selectedReport && (
        <View style={styles.reportCard}>
          <View style={styles.panelTopRow}>
            <Text style={styles.panelTitle}>
              {selectedReport.title}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup detail laporan"
              onPress={() => selectReport(null)}
            >
              <Text style={styles.closeText}>
                Tutup
              </Text>
            </Pressable>
          </View>

          <Text style={styles.mutedText}>
            {selectedReport.description}
          </Text>

          <Text style={styles.distanceText}>
            {distanceLabel
              ? `Jarak dari lokasi Anda: ${distanceLabel}`
              : 'Aktifkan GPS untuk menghitung jarak.'}
          </Text>

          <Text style={styles.reportMeta}>
            ID {selectedReport.id} {' • '}
            Status: {selectedReport.status}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  heading: {
    color: '#14213D',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 3,
  },

  countBadge: {
    backgroundColor: '#E8F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  countText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '700',
  },

  mapContainer: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 260,
  },

  mapLandscape: {
    minHeight: 180,
  },

  displayControl: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    gap: 3,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },

  displayOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  displayOptionSelected: {
    backgroundColor: '#2563EB',
  },

  displayOptionText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },

  displayOptionTextSelected: {
    color: '#FFFFFF',
  },

  clusterMarker: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#2563EB',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  clusterCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  mapLoading: {
    ...StyleSheet.absoluteFill,
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

  panelTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  panelTitle: {
    fontSize: 15,
    color: '#14213D',
    fontWeight: '800',
    flexShrink: 1,
  },

  statusText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '700',
  },

  coordinateText: {
    color: '#334155',
    fontSize: 12,
  },

  mutedText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 12,
  },

  locationButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 3,
  },

  createReportButton: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 5,
  },

  buttonPressed: {
    opacity: 0.78,
  },

  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  createReportButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

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

  closeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },

  distanceText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },

  reportMeta: {
    color: '#94A3B8',
    fontSize: 10,
  },
});
