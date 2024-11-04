'use client';

// ... (previous imports remain the same)
import { Circle as CircleIcon, ArrowsHorizontal } from 'lucide-react';

interface CircleSelection {
  center: [number, number];
  radius: number;
  points: (ItemData | PointData)[];
}

interface DragCircle {
  center: [number, number];
  radius: number;
  isResizing?: boolean;
}

const MapDashboard = ({ 
  itemsData, 
  pointsData, 
  defaultCenter = [55.2708, 25.2048],
  defaultZoom = 11 
}: MapDashboardProps) => {
  // ... (previous state remains the same)
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [circleSelection, setCircleSelection] = useState<CircleSelection | null>(null);
  const [dragCircle, setDragCircle] = useState<DragCircle | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(null);

  const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
    const R = 6371e3;
    const φ1 = (coord1[1] * Math.PI) / 180;
    const φ2 = (coord2[1] * Math.PI) / 180;
    const Δφ = ((coord2[1] - coord1[1]) * Math.PI) / 180;
    const Δλ = ((coord2[0] - coord1[0]) * Math.PI) / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleMapClick = (event: any) => {
    if (isDrawingCircle && !isDragging) {
      const clickedPoint: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      setDragCircle({
        center: clickedPoint,
        radius: 0
      });
      setIsDragging(true);
    } else if (!isDrawingCircle && event.features?.[0]) {
      setPopupInfo({
        coordinates: (event.features[0].geometry as any).coordinates,
        properties: event.features[0].properties as ItemData | PointData
      });
    }
  };

  const handleMouseMove = (event: any) => {
    setMousePosition([event.lngLat.lng, event.lngLat.lat]);
    
    if (isDragging && dragCircle) {
      const currentPoint: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      const radius = calculateDistance(dragCircle.center, currentPoint);
      setDragCircle({
        ...dragCircle,
        radius
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragCircle) {
      const itemsInCircle = filteredItems.filter(item => 
        calculateDistance(dragCircle.center, item.coordinates) <= dragCircle.radius
      );
      
      const pointsInCircle = matchedPoints.filter(point => 
        calculateDistance(dragCircle.center, point.coordinates) <= dragCircle.radius
      );

      setCircleSelection({
        center: dragCircle.center,
        radius: dragCircle.radius,
        points: [...itemsInCircle, ...pointsInCircle]
      });

      setIsDragging(false);
      setIsDrawingCircle(false);
      setDragCircle(null);
    }
  };

  const startResizing = () => {
    if (circleSelection) {
      setDragCircle({
        ...circleSelection,
        isResizing: true
      });
      setIsDragging(true);
      setIsDrawingCircle(true);
    }
  };

  // Create circle GeoJSON
  const createCircleGeoJSON = (center: [number, number], radius: number, showGuides: boolean = false) => {
    const features: any[] = [
      // Center point
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: center
        },
        properties: { type: 'center' }
      },
      // Circle
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...Array(64)].map((_, i) => {
            const angle = (i * 360) / 64;
            const rad = (angle * Math.PI) / 180;
            const latOffset = (radius / 111320) * Math.cos(rad);
            const lngOffset = (radius / (111320 * Math.cos(center[1] * Math.PI / 180))) * Math.sin(rad);
            return [
              center[0] + lngOffset,
              center[1] + latOffset
            ];
          })]
        },
        properties: { type: 'circle' }
      }
    ];

    // Add radius line and distance marker if dragging
    if (showGuides && mousePosition) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [center, mousePosition]
        },
        properties: { type: 'radius-line' }
      });

      // Add midpoint for distance label
      const midpoint = [
        (center[0] + mousePosition[0]) / 2,
        (center[1] + mousePosition[1]) / 2
      ];
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: midpoint
        },
        properties: { 
          type: 'distance-marker',
          distance: Math.round(radius)
        }
      });
    }

    return {
      type: 'FeatureCollection',
      features
    };
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Card className="w-80 h-full rounded-none border-r overflow-auto">
        <div className="p-4 space-y-4">
          {/* ... previous controls ... */}
          

        </div>
      </Card>

      {/* Map */}
      <div className="flex-1">
        <Map
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v9"
          interactiveLayerIds={isDrawingCircle ? [] : ['items-layer', 'points-layer']}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          cursor={isDrawingCircle ? (isDragging ? 'grabbing' : 'crosshair') : 'pointer'}
        >
          {/* Other layers */}

          {/* Circle Layer */}
          {(dragCircle || circleSelection) && (
            <Source 
              type="geojson" 
              data={createCircleGeoJSON(
                (dragCircle || circleSelection).center,
                (dragCircle || circleSelection).radius,
                isDragging
              )}
            >
              {/* Circle fill */}
              <Layer
                id="circle-fill"
                type="fill"
                paint={{
                  'fill-color': '#339AF0',
                  'fill-opacity': isDragging ? 0.05 : 0.1
                }}
              />
              
              {/* Circle border */}
              <Layer
                id="circle-border"
                type="line"
                paint={{
                  'line-color': '#339AF0',
                  'line-width': 2,
                  'line-dasharray': [2, 2]
                }}
              />
              
              {/* Center point */}
              <Layer
                id="circle-center"
                type="circle"
                filter={['==', ['get', 'type'], 'center']}
                paint={{
                  'circle-radius': 4,
                  'circle-color': '#339AF0',
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#fff'
                }}
              />

              {/* Radius line while dragging */}
              {isDragging && (
                <>
                  <Layer
                    id="radius-line"
                    type="line"
                    filter={['==', ['get', 'type'], 'radius-line']}
                    paint={{
                      'line-color': '#339AF0',
                      'line-width': 1,
                      'line-dasharray': [2, 2]
                    }}
                  />
                  <Layer
                    id="distance-label"
                    type="symbol"
                    filter={['==', ['get', 'type'], 'distance-marker']}
                    layout={{
                      'text-field': '{distance}m',
                      'text-anchor': 'center',
                      'text-offset': [0, -1]
                    }}
                    paint={{
                      'text-color': '#339AF0',
                      'text-halo-color': '#fff',
                      'text-halo-width': 2
                    }}
                  />
                </>
              )}
            </Source>
          )}

          {/* Other layers and popup remain the same */}
        </Map>
      </div>
    </div>
  );
};

export default MapDashboard;