import React from 'react';
import DetailView from '../../components/common/DetailView';
import { locationsApi } from '../../services/api';

const LocationDetail: React.FC = () => (
  <DetailView
    title="Location Detail"
    subtitle="Site information, capacity and pricing"
    fetcher={locationsApi.getById}
    sections={[
      {
        heading: 'Location',
        fields: [
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State' },
          { key: 'address', label: 'Address', full: true },
          { key: 'status', label: 'Status', status: true },
        ],
      },
      {
        heading: 'Capacity & Pricing',
        fields: [
          { key: 'totalChargers', label: 'Total Chargers' },
          { key: 'availableChargers', label: 'Available Chargers' },
          {
            key: 'pricePerKwh',
            label: 'Price / kWh',
            format: (v) => (v == null || v === '' ? '—' : `₹ ${v}`),
          },
          { key: 'rating', label: 'Rating' },
          { key: 'latitude', label: 'Latitude' },
          { key: 'longitude', label: 'Longitude' },
        ],
      },
    ]}
  />
);

export default LocationDetail;
