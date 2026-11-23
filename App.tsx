
import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import MapScreen from './src/screens/MapScreen';
import CreateReportScreen, {
  type ReportDraftPayload,
} from './src/screens/CreateReportScreen';

type AppScreen = 'map' | 'create-report';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('map');

  // Navigasi ke halaman pembuatan laporan.
  const handleCreateReport = useCallback(() => {
    setCurrentScreen('create-report');
  }, []);

  // Kembali ke halaman peta.
  const handleBackToMap = useCallback(() => {
    setCurrentScreen('map');
  }, []);

  // Placeholder penyimpanan draft.
  // Nantinya hubungkan dengan implementasi Anggota 1.
  const handleSaveDraft = useCallback(
    async (_draft: ReportDraftPayload): Promise<void> => {
      throw new Error(
        'Penyimpanan draft belum terhubung dengan Secure Storage.',
      );
    },
    [],
  );

  // Placeholder pengambilan foto.
  // Nantinya hubungkan dengan implementasi Anggota 3.
  const handleAddPhoto = useCallback(() => {
    Alert.alert(
      'Lampiran Foto',
      'Fitur pengambilan foto belum terintegrasi.',
    );
  }, []);

  const handleRemovePhoto = useCallback(() => {
    Alert.alert(
      'Lampiran Foto',
      'Belum ada foto yang dapat dihapus.',
    );
  }, []);

  // Placeholder permission handler.
  // Nantinya hubungkan dengan implementasi Anggota 3.
  const handleCameraPermission = useCallback(() => {
    Alert.alert(
      'Izin Kamera',
      'Handler izin kamera belum terintegrasi.',
    );
  }, []);

  const handleLocationPermission = useCallback(() => {
    Alert.alert(
      'Izin Lokasi',
      'Handler izin lokasi belum terintegrasi.',
    );
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      {currentScreen === 'map' ? (
        <MapScreen onCreateReport={handleCreateReport} />
      ) : (
        <CreateReportScreen
          onBack={handleBackToMap}
          isOnline={true}
          pendingCount={0}
          photoUri={null}
          cameraPermissionGranted={false}
          locationPermissionGranted={false}
          onSaveDraft={handleSaveDraft}
          onAddPhoto={handleAddPhoto}
          onRemovePhoto={handleRemovePhoto}
          onRequestCameraPermission={handleCameraPermission}
          onRequestLocationPermission={handleLocationPermission}
        />
      )}
    </SafeAreaProvider>
  );
}
