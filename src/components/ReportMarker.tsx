import React, { memo } from 'react';
import { Marker } from 'react-native-maps';
import type { CivicReport } from '../types';

type Props = {
  report: CivicReport;
  onPress: (report: CivicReport) => void;
};

const STATUS_COLOR: Record<CivicReport['status'], string> = {
  submitted: '#D64545',
  verified: '#E9A23B',
  resolved: '#2E9D62',
};

function ReportMarkerComponent({ report, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: report.latitude, longitude: report.longitude }}
      title={report.title}
      description={report.description}
      pinColor={STATUS_COLOR[report.status]}
      onPress={() => onPress(report)}
    />
  );
}

export const ReportMarker = memo(ReportMarkerComponent);