
import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

interface PermissionDisclosureProps {
  type: 'camera' | 'location';
  granted: boolean;
  onRequest: () => void;
}

const PermissionDisclosure = memo(
  ({ type, granted, onRequest }: PermissionDisclosureProps) => {
    const isCamera = type === 'camera';

    const title = isCamera
      ? 'Akses Kamera'
      : 'Akses Lokasi';

    const description = isCamera
      ? 'Kamera digunakan untuk mengambil foto kerusakan fasilitas publik sebagai bukti laporan.'
      : 'Lokasi digunakan untuk menambahkan koordinat kejadian agar laporan dapat dipetakan secara akurat.';

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            {description}
          </Text>

          <Text style={styles.status}>
            {granted ? 'Izin telah diberikan' : 'Izin belum diberikan'}
          </Text>
        </View>

        {!granted && (
          <Pressable
            onPress={onRequest}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel={`Berikan izin ${title}`}
          >
            <Text style={styles.buttonText}>
              Aktifkan
            </Text>
          </Pressable>
        )}
      </View>
    );
  }
);

PermissionDisclosure.displayName = 'PermissionDisclosure';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#142640',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#294563',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: '#A8BAD0',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  status: {
    color: '#36D5B0',
    fontSize: 12,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#238BCE',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default PermissionDisclosure;
