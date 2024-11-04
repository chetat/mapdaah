'use client';

import { useState, useMemo } from 'react';
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { X, Circle } from 'lucide-react';

import { Circle as CircleIcon, ArrowBigUp as ArrowsHorizontal } from 'lucide-react';

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

interface ItemData {
  id: string;
  coordinates: [number, number];
  timestamp: string;
}

interface PointData {
  name: string;
  coordinates: [number, number];
}

interface PopupInfo {
  coordinates: [number, number];
  properties: ItemData | PointData;
}

interface MapDashboardProps {
  itemsData: ItemData[];
  pointsData: PointData[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}


interface CircleSelection {
  center: [number, number];
  radius: number; // in meters
  points: (ItemData | PointData)[];
}

const MapDashboard = ({
  itemsData,
  pointsData,
  defaultCenter = [55.2708, 25.2048],
  defaultZoom = 11
}: MapDashboardProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState<ItemData[]>(itemsData);
  const [matchedPoints, setMatchedPoints] = useState<PointData[]>(pointsData);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const [viewport, setViewport] = useState({
    longitude: defaultCenter[0],
    latitude: defaultCenter[1],
    zoom: defaultZoom
  });

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

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

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


  // Threshold for considering coordinates as "same location" (in degrees)
  const LOCATION_THRESHOLD = 0.001; // Approximately 111 meters

  const isNearby = (coord1: [number, number], coord2: [number, number]): boolean => {
    return Math.abs(coord1[0] - coord2[0]) < LOCATION_THRESHOLD &&
      Math.abs(coord1[1] - coord2[1]) < LOCATION_THRESHOLD;
  };

  const handleFilterById = (id: string) => {
    setSelectedId(id);
    if (id) {
      // Filter items by ID
      const filtered = itemsData.filter(item =>
        item.id.toLowerCase().includes(id.toLowerCase())
      );
      setFilteredItems(filtered);

      // Find points that match any of the filtered items' locations
      const relatedPoints = pointsData.filter(point =>
        filtered.some(item => isNearby(item.coordinates, point.coordinates))
      );
      setMatchedPoints(relatedPoints);

      // Adjust viewport to show filtered items
      if (filtered.length > 0) {
        const lngs = filtered.map(item => item.coordinates[0]);
        const lats = filtered.map(item => item.coordinates[1]);

        setViewport({
          longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          zoom: filtered.length === 1 ? 14 : 12
        });
      }
    } else {
      setFilteredItems(itemsData);
      setMatchedPoints(pointsData);
      setViewport({
        longitude: defaultCenter[0],
        latitude: defaultCenter[1],
        zoom: defaultZoom
      });
    }
  };

  // Create path for selected items
  const pathData = useMemo(() => {
    if (!selectedId || filteredItems.length < 2) return null;

    const sortedPoints = [...filteredItems]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: sortedPoints.map(item => item.coordinates)
      }
    };
  }, [selectedId, filteredItems]);

  const handleClearFilter = () => {
    setSelectedId(null);
    setFilteredItems(itemsData);
    setMatchedPoints(pointsData);
    setViewport({
      longitude: defaultCenter[0],
      latitude: defaultCenter[1],
      zoom: defaultZoom
    });
    setPopupInfo(null);
  };

  return (
    <div className="flex h-screen">
      <Card className="w-1/5 px-8 h-full rounded-none border-r">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-id">Filter by Item ID</Label>
            <div className="flex gap-2">
              <Input
                id="item-id"
                placeholder="Enter Item ID"
                value={selectedId || ''}
                onChange={(e) => handleFilterById(e.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilter}
                disabled={!selectedId}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedId && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                Found {filteredItems.length} item locations
              </div>
              <div className="text-sm text-gray-500">
                Related points: {matchedPoints.length}
              </div>
            </div>
          )}
        </div>

        {/* Circle Selection Controls */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Circle Selection</h3>
            {circleSelection && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startResizing}
                >
                  <ArrowsHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCircleSelection(null);
                    setIsDrawingCircle(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            variant={isDrawingCircle ? "destructive" : "outline"}
            className="w-full"
            onClick={() => {
              setIsDrawingCircle(!isDrawingCircle);
              if (isDrawingCircle) {
                setCircleSelection(null);
                setDragCircle(null);
                setIsDragging(false);
              }
            }}
          >
            <CircleIcon className="h-4 w-4 mr-2" />
            {isDrawingCircle ? 'Cancel' : 'Draw Circle'}
          </Button>

          {isDrawingCircle && (
            <div className="p-2 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                1. Click on the map to set the circle center
              </p>
              <p className="text-sm text-muted-foreground">
                2. Drag to set the radius
              </p>
              <p className="text-sm text-muted-foreground">
                3. Release to complete
              </p>
            </div>
          )}

          {/* Points within Circle Table */}
          {circleSelection && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">
                  Points within {Math.round(circleSelection.radius)}m radius
                </h4>
                <span className="text-sm text-muted-foreground">
                  {circleSelection.points.length} found
                </span>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name/ID</TableHead>
                      <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {circleSelection.points.map((point, index) => {
                      const distance = Math.round(
                        calculateDistance(
                          circleSelection.center,
                          point.coordinates
                        )
                      );
                      return (
                        <TableRow
                          key={index}
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => {
                            // Center map on this point
                            setViewport({
                              ...viewport,
                              longitude: point.coordinates[0],
                              latitude: point.coordinates[1],
                              zoom: 14
                            });
                          }}
                        >
                          <TableCell>
                            {'id' in point ? 'Item' : 'Point'}
                          </TableCell>
                          <TableCell>
                            {'id' in point ? point.id : point.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {distance}m
                          </TableCell>
                        </TableRow>
                      )
                    }
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>


        <div className="space-y-2 pt-4 border-t">
          {/* Legend */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium">Map Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#FF6B6B] border-2 border-white shadow-sm"></div>
                <span className="text-sm text-gray-600">Tracked Items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#339AF0] border-2 border-white shadow-sm"></div>
                <span className="text-sm text-gray-600">Points of Interest</span>
              </div>
              {pathData && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0 border border-dashed border-[#FF6B6B]"></div>
                  <span className="text-sm text-gray-600">Item Path</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex-1 relative">
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
          <NavigationControl position="top-right" />

          {/* Path Layer */}
          {pathData && (
            <Source id="path-source" type="geojson" data={pathData}>
              <Layer
                id="path-layer"
                type="line"
                paint={{
                  'line-color': '#FF6B6B',
                  'line-width': 2,
                  'line-dasharray': [2, 1]
                }}
              />
            </Source>
          )}

          {/* Items Layer */}
          <Source
            id="items-source"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: filteredItems.map(item => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: item.coordinates
                },
                properties: item
              }))
            }}
          >
            <Layer
              id="items-layer"
              type="circle"
              paint={{
                'circle-radius': 8,
                'circle-color': '#FF6B6B',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.9
              }}
            />
          </Source>

          {/* Points Layer */}
          <Source
            id="points-source"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: matchedPoints.map(point => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: point.coordinates
                },
                properties: point
              }))
            }}
          >
            <Layer
              id="points-layer"
              type="circle"
              paint={{
                'circle-radius': 6,
                'circle-color': '#339AF0',
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#fff',
                'circle-opacity': 0.85
              }}
            />
          </Source>


          {/* Circle Selection Layer */}
          {(dragCircle || circleSelection) && (
            <>
              {/* Main circle */}
              <Source
                id="circle-selection"
                type="geojson"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: (dragCircle?.center || circleSelection?.center)
                      },
                      properties: { type: 'center' }
                    },
                    {
                      type: 'Feature',
                      geometry: {
                        type: 'Polygon',
                        coordinates: [[...Array(64)].map((_, i) => {
                          const angle = (i * 360) / 64;
                          const rad = (angle * Math.PI) / 180;
                          const radius = (dragCircle?.radius || circleSelection?.radius || 0);
                          const latOffset = (radius / 111320) * Math.cos(rad);
                          const lngOffset = (radius / (111320 * Math.cos(((dragCircle?.center || circleSelection?.center)![1] * Math.PI) / 180))) * Math.sin(rad);
                          return [
                            (dragCircle?.center?.[0] ?? circleSelection?.center?.[0] ?? 0) + lngOffset,
                            (dragCircle?.center?.[1] ?? circleSelection?.center?.[1] ?? 0) + latOffset
                          ];
                        })]
                      },
                      properties: { type: 'circle' }
                    }
                  ]
                }}
              >
                <Layer
                  id="circle-fill"
                  type="fill"
                  paint={{
                    'fill-color': '#339AF0',
                    'fill-opacity': isDragging ? 0.05 : 0.1
                  }}
                />

                <Layer
                  id="circle-border"
                  type="line"
                  paint={{
                    'line-color': '#339AF0',
                    'line-width': 2,
                    'line-dasharray': [2, 2]
                  }}
                />

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
              </Source>

              {/* Radius guide elements */}
              {isDragging && mousePosition && (
                <Source
                  id="circle-guides"
                  type="geojson"
                  data={{
                    type: 'FeatureCollection',
                    features: [
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'LineString',
                          coordinates: [(dragCircle?.center || circleSelection?.center)!, mousePosition]
                        },
                        properties: {}
                      },
                      {
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [
                            ((dragCircle?.center[0] ?? circleSelection?.center[0] ?? 0) + mousePosition[0]) / 2,
                            ((dragCircle?.center[1] ?? circleSelection?.center[1] ?? 0) + mousePosition[1]) / 2
                          ]
                        },
                        properties: {
                          distance: Math.round((dragCircle || circleSelection).radius)
                        }
                      }
                    ]
                  }}
                >
                  <Layer
                    id="radius-line"
                    type="line"
                    paint={{
                      'line-color': '#339AF0',
                      'line-width': 1,
                      'line-dasharray': [2, 2]
                    }}
                  />
                  <Layer
                    id="distance-label"
                    type="symbol"
                    layout={{
                      'text-field': ['concat', ['get', 'distance'], 'm'],
                      'text-anchor': 'center',
                      'text-offset': [0, -1],
                      'text-size': 12
                    }}
                    paint={{
                      'text-color': '#339AF0',
                      'text-halo-color': '#fff',
                      'text-halo-width': 2
                    }}
                  />
                </Source>
              )}
            </>
          )}

          {/* Popup remains the same */}
          {popupInfo && (
            <Popup
              longitude={popupInfo.coordinates[0]}
              latitude={popupInfo.coordinates[1]}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
            >
              <div className="p-2">
                <h3 className="font-medium">
                  {'id' in popupInfo.properties
                    ? `Item ${popupInfo.properties.id}`
                    : popupInfo.properties.name}
                </h3>
                {'timestamp' in popupInfo.properties && (
                  <p className="text-sm text-gray-500">
                    Timestamp: {popupInfo.properties.timestamp}
                  </p>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};

export default MapDashboard;