'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L, { LatLngExpression, LatLngBoundsExpression } from 'leaflet';
import type { LocationPoint } from './page';

// Ícone customizado para o caminhão
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/61/61922.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Componente para ajustar o zoom e a posição do mapa
const FitBounds = ({ bounds }: { bounds: LatLngBoundsExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [map, bounds]);
  return null;
};

interface RealTimeMapProps {
  locationHistory: LocationPoint[];
}

export default function RealTimeMap({ locationHistory }: RealTimeMapProps) {
  const { positions, bounds, lastPosition } = useMemo(() => {
    if (!locationHistory || locationHistory.length === 0) {
      return { positions: [], bounds: null, lastPosition: null };
    }
    const pos: LatLngExpression[] = locationHistory.map(p => [p.latitude, p.longitude]);
    const bds: LatLngBoundsExpression = L.latLngBounds(pos);
    const lastPos: LatLngExpression = pos[pos.length - 1];

    return { positions: pos, bounds: bds, lastPosition: lastPos };
  }, [locationHistory]);
  
  
  if (!lastPosition || !bounds) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Aguardando dados de localização...</div>;
  }

  return (
    <MapContainer 
      center={lastPosition} 
      zoom={15} 
      style={{ height: '100%', width: '100%' }} 
      className="rounded-md z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {positions.length > 0 && <Polyline positions={positions} color="blue" />}
      <Marker position={lastPosition} icon={truckIcon} />
      <FitBounds bounds={bounds} />
    </MapContainer>
  );
}
