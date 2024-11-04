'use client';

import MapDashboard from '@/components/Map';

export default function Page() {
  const itemsData = [
    // Dubai Downtown area
    {
      id: '1',
      coordinates: [55.2744, 25.2048] as [number, number], // Dubai Mall/Burj Khalifa
      timestamp: '2024-02-01T10:00:00Z'
    },
    {
      id: '1',
      coordinates: [55.2885, 25.2048] as [number, number], // DIFC
      timestamp: '2024-02-01T11:30:00Z'
    },
    {
      id: '1',
      coordinates: [55.3034, 25.2285] as [number, number], // Dubai Healthcare City
      timestamp: '2024-02-01T13:00:00Z'
    },
    // Different item in Dubai Marina area
    {
      id: '2',
      coordinates: [55.1367, 25.0806] as [number, number], // Dubai Marina Mall
      timestamp: '2024-02-01T09:00:00Z'
    },
    {
      id: '2',
      coordinates: [55.1484, 25.0889] as [number, number], // JLT
      timestamp: '2024-02-01T10:15:00Z'
    },
    {
      id: '2',
      coordinates: [55.1321, 25.0656] as [number, number], // Dubai Marina Yacht Club
      timestamp: '2024-02-01T11:45:00Z'
    },
    // Third item covering Business Bay
    {
      id: '3',
      coordinates: [55.2644, 25.1872] as [number, number], // Business Bay
      timestamp: '2024-02-01T14:00:00Z'
    },
    {
      id: '3',
      coordinates: [55.2697, 25.1927] as [number, number], // Dubai Water Canal
      timestamp: '2024-02-01T15:30:00Z'
    },
    {
      id: '3',
      coordinates: [55.2585, 25.1833] as [number, number], // Bay Avenue
      timestamp: '2024-02-01T17:00:00Z'
    }
  ];

  const pointsData = [
    {
      name: 'Burj Khalifa',
      coordinates: [55.2744, 25.2048] as [number, number]
    },
    {
      name: 'Dubai Mall',
      coordinates: [55.2796, 25.1972] as [number, number]
    },
    {
      name: 'Dubai Marina',
      coordinates: [55.1367, 25.0806] as [number, number]
    },
    {
      name: 'Palm Jumeirah',
      coordinates: [55.1384, 25.1123] as [number, number]
    },
    {
      name: 'Dubai International Airport',
      coordinates: [55.3644, 25.2532] as [number, number]
    },
    {
      name: 'Burj Al Arab',
      coordinates: [55.1854, 25.1412] as [number, number]
    },
    {
      name: 'Dubai Creek',
      coordinates: [55.3241, 25.2485] as [number, number]
    },
    {
      name: 'Gold Souk',
      coordinates: [55.2852, 25.2867] as [number, number]
    }
  ];

  return (
    <MapDashboard 
      itemsData={itemsData} 
      pointsData={pointsData} 
      defaultCenter={[55.2708, 25.2048]} // Center on Downtown Dubai
      defaultZoom={11} // Zoom level to show Dubai city
    />
  );
}