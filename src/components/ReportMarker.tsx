import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import type { CivicReport } from '../types';

type Props = {
  report: CivicReport;
  onPress: (report: CivicReport) => void;
};

const CATEGORY_COLOR: Record<CivicReport['category'], string> = {
  road: '#E76F51',
  streetlight: '#E9A23B',
  flood: '#2878D0',
  'public-facility': '#7B61A8',
};

function ReportMarkerComponent({ report, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: report.latitude, longitude: report.longitude }}
      title={report.title}
      description={report.description}
      pinColor={CATEGORY_COLOR[report.category]}
      onPress={() => onPress(report)}
    />
  );
}

export const ReportMarker = memo(ReportMarkerComponent);
