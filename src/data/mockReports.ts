import type { CivicReport } from '../types';

// Data simulasi untuk Week 9. Ganti dengan API/backend pada milestone berikutnya.
export const MOCK_REPORTS: CivicReport[] = [
  {
    id: 'RPT-001',
    title: 'Jalan berlubang',
    description: 'Terdapat lubang di sisi kiri jalan.',
    category: 'road',
    latitude: -7.2575,
    longitude: 112.7521,
    createdAt: '2026-11-20T08:30:00.000Z',
    status: 'submitted',
  },
  {
    id: 'RPT-002',
    title: 'Lampu jalan mati',
    description: 'Lampu penerangan tidak menyala pada malam hari.',
    category: 'streetlight',
    latitude: -7.2601,
    longitude: 112.7508,
    createdAt: '2026-11-21T14:15:00.000Z',
    status: 'verified',
  },
  {
    id: 'RPT-003',
    title: 'Genangan air',
    description: 'Genangan setelah hujan di dekat persimpangan.',
    category: 'flood',
    latitude: -7.2549,
    longitude: 112.755,
    createdAt: '2026-11-22T04:00:00.000Z',
    status: 'submitted',
  },
];
