
import React, {
  memo,
  useState,
  useMemo,
  useCallback,
} from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import OfflineStatusBanner from '../components/OfflineStatusBanner';
import PermissionDisclosure from '../components/PermissionDisclosure';
import MediaAttachmentCard from '../components/MediaAttachmentCard';

type ReportCategory =
  | 'Jalan Rusak'
  | 'Banjir'
  | 'Lampu Jalan'
  | 'Fasilitas Umum';

export interface ReportDraftPayload {
  title: string;
  description: string;
  category: ReportCategory;
  photoUri: string | null;
}

interface CreateReportScreenProps {
  onBack: () => void;

  isOnline: boolean;
  pendingCount: number;

  photoUri: string | null;

  cameraPermissionGranted: boolean;
  locationPermissionGranted: boolean;

  onSaveDraft: (draft: ReportDraftPayload) => Promise<void>;

  onAddPhoto: () => void;
  onRemovePhoto: () => void;

  onRequestCameraPermission: () => void;
  onRequestLocationPermission: () => void;
}

const CATEGORIES: ReportCategory[] = [
  'Jalan Rusak',
  'Banjir',
  'Lampu Jalan',
  'Fasilitas Umum',
];

const CreateReportScreen = memo(
  ({
    onBack,
    isOnline,
    pendingCount,
    photoUri,
    cameraPermissionGranted,
    locationPermissionGranted,
    onSaveDraft,
    onAddPhoto,
    onRemovePhoto,
    onRequestCameraPermission,
    onRequestLocationPermission,
  }: CreateReportScreenProps) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [category, setCategory] =
      useState<ReportCategory>('Jalan Rusak');

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    // Validasi formulir.
    const canSave = useMemo(() => {
      return (
        title.trim().length >= 5 &&
        description.trim().length >= 10 &&
        !isSaving
      );
    }, [title, description, isSaving]);

    // Simpan draft.
    const handleSaveDraft = useCallback(async () => {
      if (!canSave) return;

      setIsSaving(true);
      setSaveStatus('');

      const payload: ReportDraftPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        photoUri,
      };

      try {
        await onSaveDraft(payload);

        setSaveStatus('Draft berhasil disimpan.');

        setTitle('');
        setDescription('');
        setCategory('Jalan Rusak');
      } catch (error) {
        console.error('Save draft error:', error);

        setSaveStatus(
          'Draft gagal disimpan. Silakan coba kembali.',
        );
      } finally {
        setIsSaving(false);
      }
    }, [
      canSave,
      title,
      description,
      category,
      photoUri,
      onSaveDraft,
    ]);

    // Input handlers.
    const handleTitleChange = useCallback(
      (value: string) => {
        setTitle(value);
      },
      [],
    );

    const handleDescriptionChange = useCallback(
      (value: string) => {
        setDescription(value);
      },
      [],
    );

    const handleCategoryChange = useCallback(
      (value: ReportCategory) => {
        setCategory(value);
      },
      [],
    );

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke peta laporan"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.backButtonText}>
                ‹ Kembali
              </Text>
            </Pressable>

            <Text style={styles.heading}>
              Buat Laporan
            </Text>
          </View>

          <Text style={styles.subtitle}>
            Laporkan kerusakan fasilitas publik
            untuk membantu menciptakan lingkungan
            yang lebih aman.
          </Text>

          {/* OFFLINE STATUS */}
          <OfflineStatusBanner
            isOnline={isOnline}
            pendingCount={pendingCount}
          />

          {/* REPORT INFORMATION */}
          <Text style={styles.sectionTitle}>
            Informasi Laporan
          </Text>

          <Text style={styles.label}>
            Judul Laporan
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Contoh: Jalan berlubang"
            placeholderTextColor="#8294A9"
            value={title}
            onChangeText={handleTitleChange}
            maxLength={80}
            accessibilityLabel="Judul laporan"
            accessibilityHint="Masukkan judul kerusakan fasilitas publik"
          />

          <Text style={styles.label}>
            Kategori Kerusakan
          </Text>

          <View style={styles.categoryContainer}>
            {CATEGORIES.map((item) => {
              const selected = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => handleCategoryChange(item)}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    selected && styles.categorySelected,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Kategori ${item}`}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>
            Deskripsi
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            placeholder="Jelaskan kondisi kerusakan dan lokasi kejadian..."
            placeholderTextColor="#8294A9"
            value={description}
            onChangeText={handleDescriptionChange}
            multiline
            textAlignVertical="top"
            maxLength={500}
            accessibilityLabel="Deskripsi laporan"
            accessibilityHint="Jelaskan detail kerusakan fasilitas publik"
          />

          {/* MEDIA ATTACHMENT */}
          <MediaAttachmentCard
            photoUri={photoUri}
            onAddPhoto={onAddPhoto}
            onRemovePhoto={onRemovePhoto}
          />

          {/* PERMISSION SETTINGS */}
          <Text style={styles.sectionTitle}>
            Pengaturan Izin
          </Text>

          <PermissionDisclosure
            type="camera"
            granted={cameraPermissionGranted}
            onRequest={onRequestCameraPermission}
          />

          <PermissionDisclosure
            type="location"
            granted={locationPermissionGranted}
            onRequest={onRequestLocationPermission}
          />

          <Text style={styles.helper}>
            Pastikan izin yang dibutuhkan telah diberikan
            sebelum menggunakan fitur pengambilan foto
            dan lokasi.
          </Text>

          {/* SAVE DRAFT BUTTON */}
          <Pressable
            onPress={handleSaveDraft}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.saveDisabled,
              pressed && canSave && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !canSave,
              busy: isSaving,
            }}
            accessibilityLabel="Simpan draft laporan"
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
            </Text>
          </Pressable>

          {/* SAVE STATUS */}
          {saveStatus !== '' && (
            <Text
              style={styles.saveStatus}
              accessibilityRole="alert"
            >
              {saveStatus}
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  },
);

CreateReportScreen.displayName = 'CreateReportScreen';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#071426',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  topBar: {
    marginBottom: 10,
    gap: 12,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#142640',
    borderRadius: 9,
    minHeight: 40,
    justifyContent: 'center',
  },

  backButtonText: {
    color: '#43D0E2',
    fontSize: 13,
    fontWeight: '700',
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    color: '#9FB2C9',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },

  sectionTitle: {
    color: '#43D0E2',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 10,
  },

  label: {
    color: '#EAF2FC',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    backgroundColor: '#142640',
    borderWidth: 1,
    borderColor: '#294563',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 48,
  },

  textArea: {
    height: 120,
    paddingTop: 14,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  categoryButton: {
    backgroundColor: '#142640',
    borderWidth: 1,
    borderColor: '#294563',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },

  categorySelected: {
    backgroundColor: '#12485A',
    borderColor: '#42D0E2',
  },

  categoryText: {
    color: '#B9C9DC',
    fontSize: 12,
  },

  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  helper: {
    color: '#93A8BF',
    fontSize: 12,
    lineHeight: 19,
    marginVertical: 12,
  },

  saveButton: {
    backgroundColor: '#168FC7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    marginTop: 10,
  },

  saveDisabled: {
    backgroundColor: '#40566C',
    opacity: 0.65,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  saveStatus: {
    color: '#42D0AE',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
  },
});

export default CreateReportScreen;
