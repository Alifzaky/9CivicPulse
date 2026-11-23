export type ReportCategory = 'road' | 'streetlight' | 'flood' | 'public-facility';

export type CivicReport = {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  createdAt: string;
  status: 'submitted' | 'verified' | 'resolved';
  jumlah_dukungan?: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};
