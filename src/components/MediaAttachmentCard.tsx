
import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';

interface MediaAttachmentCardProps {
  photoUri: string | null;
  onAddPhoto: () => void;
  onRemovePhoto: () => void;
}

const MediaAttachmentCard = memo(
  ({
    photoUri,
    onAddPhoto,
    onRemovePhoto,
  }: MediaAttachmentCardProps) => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Bukti Foto Laporan
        </Text>

        <Text style={styles.subtitle}>
          Tambahkan foto kerusakan fasilitas publik.
        </Text>

        {photoUri ? (
          <View>
            <Image
              source={{ uri: photoUri }}
              style={styles.preview}
              resizeMode="cover"
              accessibilityLabel="Preview foto bukti laporan"
            />

            <Pressable
              onPress={onRemovePhoto}
              style={styles.removeButton}
              accessibilityRole="button"
              accessibilityLabel="Hapus foto laporan"
            >
              <Text style={styles.removeText}>
                Hapus Foto
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={onAddPhoto}
            style={styles.uploadButton}
            accessibilityRole="button"
            accessibilityLabel="Tambahkan foto laporan"
          >
            <Text style={styles.uploadIcon}>+</Text>
            <Text style={styles.uploadText}>
              Tambahkan Foto
            </Text>
          </Pressable>
        )}
      </View>
    );
  }
);

MediaAttachmentCard.displayName = 'MediaAttachmentCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#142640',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#294563',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A8BAD0',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 14,
  },
  uploadButton: {
    height: 125,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#42C8DC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    color: '#42C8DC',
    fontSize: 32,
  },
  uploadText: {
    color: '#42C8DC',
    fontWeight: '600',
    marginTop: 5,
  },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: 10,
  },
  removeButton: {
    backgroundColor: '#702D38',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default MediaAttachmentCard;
