// types/map.ts
export interface ItemData {
    id: string;
    name?: string;
    coordinates: [number, number];
    timestamp: string;
  }
  
  export interface PointData {
    name: string;
    coordinates: [number, number];
  }
  
  export interface MapComponentProps {
    className?: string;
    itemsData: ItemData[];
    pointsData: PointData[];
    selectedId: string | null;
  }
  
  export interface MapDashboardProps {
    itemsData: ItemData[];
    pointsData: PointData[];
  }