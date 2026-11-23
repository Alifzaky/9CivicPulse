
import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineStatusBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

const OfflineStatusBanner = memo(
  ({ isOnline, pendingCount }: OfflineStatusBannerProps) => {
    return (
      <View
        style={[
          styles.container,
          isOnline ? styles.online : styles.offline,
        ]}
        accessibilityRole="summary"
        accessibilityLabel={
          isOnline
            ? `Online. ${pendingCount} laporan menunggu sinkronisasi`
            : 'Offline. Laporan dapat disimpan sebagai draft'
        }
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: isOnline ? '#32D69A' : '#FFB454' },
          ]}
        />

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {isOnline ? 'Terhubung' : 'Mode Offline'}
          </Text>

          <Text style={styles.subtitle}>
            {isOnline
              ? pendingCount > 0
                ? `${pendingCount} laporan menunggu sinkronisasi`
                : 'Semua laporan siap disinkronkan'
              : 'Simpan laporan sebagai draft terlebih dahulu'}
          </Text>
        </View>
      </View>
    );
  }
);

OfflineStatusBanner.displayName = 'OfflineStatusBanner';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  online: {
    backgroundColor: '#102D2A',
    borderColor: '#237B68',
  },
  offline: {
    backgroundColor: '#38291B',
    borderColor: '#A66B2B',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    color: '#C3CEDD',
    fontSize: 12,
    marginTop: 4,
  },
});

export default OfflineStatusBanner;
