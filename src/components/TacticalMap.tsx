"use client";
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TARGET_COORD: [number, number] = [36.899, 10.189]; // ESB: Esprit School of Business

const ALGERIAN_BORDER_POINTS: [number, number][] = [
  [36.95, 8.80], [36.70, 8.65], [36.45, 8.45], [36.20, 8.35], [35.85, 8.30],
  [35.45, 8.45], [35.15, 8.60], [34.75, 8.55], [34.35, 8.30], [34.05, 8.05],
  [33.70, 7.85], [33.35, 7.75], [33.00, 7.95], [32.60, 8.35], [32.15, 8.75],
  [31.70, 9.05], [31.25, 9.35], [30.75, 9.60], [30.30, 9.65]
];

const LIBYAN_BORDER_POINTS: [number, number][] = [
  [30.30, 9.65], [30.70, 9.90], [31.15, 10.25], [31.65, 10.50], [32.00, 10.75],
  [32.35, 10.95], [32.70, 11.20], [33.00, 11.45], [33.15, 11.55]
];

const CORRIDORS = [
  { from: TARGET_COORD, to: [32.90, 10.45] as [number, number], count: 35 },
  { from: [33.13, 11.21] as [number, number], to: [33.35, 10.50] as [number, number], count: 40 },
  { from: [33.70, 7.85] as [number, number], to: [33.90, 8.15] as [number, number], count: 25 },
  { from: [35.15, 8.60] as [number, number], to: [35.25, 8.85] as [number, number], count: 30 }
];

interface MapProps {
  activeAlert: boolean;
  showPrediction: boolean;
  onNodeClick: () => void;
}

export default function TacticalMap({ activeAlert, showPrediction, onNodeClick }: MapProps) {
  const meshNodes = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = 0; i < ALGERIAN_BORDER_POINTS.length - 1; i++) {
      const p1 = ALGERIAN_BORDER_POINTS[i];
      const p2 = ALGERIAN_BORDER_POINTS[i + 1];
      for (let s = 0; s < 7; s++) {
        list.push([
          p1[0] + (p2[0] - p1[0]) * (s / 7) + (Math.random() - 0.5) * 0.08,
          p1[1] + (p2[1] - p1[1]) * (s / 7) + Math.random() * 0.08
        ]);
      }
    }
    for (let i = 0; i < LIBYAN_BORDER_POINTS.length - 1; i++) {
      const p1 = LIBYAN_BORDER_POINTS[i];
      const p2 = LIBYAN_BORDER_POINTS[i + 1];
      for (let s = 0; s < 9; s++) {
        list.push([
          p1[0] + (p2[0] - p1[0]) * (s / 9) + (Math.random() - 0.5) * 0.08,
          p1[1] + (p2[1] - p1[1]) * (s / 9) - Math.random() * 0.08
        ]);
      }
    }
    CORRIDORS.forEach(c => {
      for (let i = 0; i < c.count; i++) {
        list.push([
          c.from[0] + (c.to[0] - c.from[0]) * Math.random() + (Math.random() - 0.5) * 0.12,
          c.from[1] + (c.to[1] - c.from[1]) * Math.random() + (Math.random() - 0.5) * 0.12
        ]);
      }
    });
    for (let i = 0; i < 40; i++) {
      list.push([31.0 + Math.random() * 1.8, 9.2 + Math.random() * 1.3]);
    }
    return list;
  }, []);

  return (
    <MapContainer center={[35.5, 9.5]} className="w-full h-full z-0" zoom={6.5} zoomControl={false}>
      <TileLayer 
        attribution="&copy; Esri &mdash; Esri, DeLorme, NAVTEQ" 
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
      />

      {meshNodes.map((coord, idx) => (
        <CircleMarker 
          key={`node-${idx}`} 
          center={coord as [number, number]} 
          radius={2.5} 
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.6, weight: 0.5 }}
        />
      ))}

      {/* Standby Node - Now Clickable and slightly larger */}
      {!activeAlert ? (
        <CircleMarker 
          center={TARGET_COORD} 
          radius={6} 
          eventHandlers={{ click: onNodeClick }}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.8, weight: 2 }}
        >
          <Popup>Nœud #44 (ESB): VEILLE (Cliquez pour ouvrir le flux)</Popup>
        </CircleMarker>
      ) : (
        <>
          <CircleMarker 
            center={TARGET_COORD} 
            radius={6} 
            eventHandlers={{ click: onNodeClick }}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
          >
            <Popup>Nœud #44: ALERTE (Cliquez pour analyser)</Popup>
          </CircleMarker>
          <CircleMarker 
            center={TARGET_COORD} 
            radius={25} 
            pathOptions={{ color: '#ef4444', fillOpacity: 0.1, weight: 1 }}
          />
        </>
      )}

      {showPrediction && (
         <>
          <Polyline 
            positions={[TARGET_COORD, [32.35, 10.45], [32.60, 10.55], [32.85, 10.60]]} 
            pathOptions={{ color: '#f97316', weight: 2.5, opacity: 0.8, dashArray: '8, 6' }}
          />
          <CircleMarker 
            center={[32.35, 10.45]} 
            radius={4} 
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.8, weight: 2 }}
          />
          <CircleMarker 
            center={[32.60, 10.55]} 
            radius={4} 
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.8, weight: 2 }}
          />
         </>
      )}
    </MapContainer>
  );
}
