import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertTriangle } from "lucide-react";

interface RegionStats {
  name: string;
  totalRegistered: number;
  pendingApplications: number;
  pendingUpdates: number;
  linkedCredentials: number;
  averageConfidence: number;
  fraudScore: number;
  fraudRisk: 'low' | 'medium' | 'high';
  flaggedRecords: number;
  recentEvents: string[];
}

export interface IndiaMapProps {
  data: Record<string, RegionStats>;
  isDarkMode: boolean;
  selectedState?: string | null;
  onRegionClick?: (name: string) => void;
}

export default function IndiaMap({
  data,
  isDarkMode,
  selectedState: _selectedState,
  onRegionClick
}: IndiaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token) {
      setTokenMissing(true);
      return;
    }
    mapboxgl.accessToken = token;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
      center: [82.8, 22.5],
      zoom: 4,
    });

    mapRef.current = map;

    // Create popup instance
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.on('load', () => {
      // Add India GeoJSON source
      map.addSource('india-states', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson'
      });

      // Build match expression from data prop
      const matchExpression: any[] = ['match', ['coalesce', ['get', 'NAME_1'], ['get', 'st_nm'], '']];

      for (const [stateName, stats] of Object.entries(data)) {
        let color = '#22c55e'; // emerald
        if (stats.fraudScore >= 7) color = '#ef4444'; // red
        else if (stats.fraudScore >= 4) color = '#f59e0b'; // amber

        matchExpression.push(stateName, color);
      }

      // Default color if state not found
      matchExpression.push('rgba(156, 163, 175, 0.2)'); // grayish fallback

      map.addLayer({
        id: 'state-fills',
        type: 'fill',
        source: 'india-states',
        paint: {
          'fill-color': matchExpression as mapboxgl.Expression,
          'fill-opacity': 0.7
        }
      });

      map.addLayer({
        id: 'state-borders',
        type: 'line',
        source: 'india-states',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5
        }
      });

      // Hover popup logic
      map.on('mousemove', 'state-fills', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const stateName = feature.properties?.NAME_1 || feature.properties?.st_nm;
        const stats = stateName ? data[stateName] : null;

        if (stateName && stats) {
          map.getCanvas().style.cursor = 'pointer';

          const popupHtml = `
            <div style="font-family: inherit; padding: 4px; color: ${isDarkMode ? '#e2e8f0' : '#1e293b'};">
              <h4 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${stateName}</h4>
              <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; gap: 12px;">
                <span>Fraud Score:</span> <strong>${stats.fraudScore.toFixed(1)}/10</strong>
              </div>
              <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; gap: 12px;">
                <span>Registered:</span> <strong>${stats.totalRegistered.toLocaleString()}</strong>
              </div>
              <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; gap: 12px;">
                <span>Pending Apps:</span> <strong>${stats.pendingApplications.toLocaleString()}</strong>
              </div>
              <div style="font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; gap: 12px;">
                <span>Flagged Records:</span> <strong>${stats.flaggedRecords.toLocaleString()}</strong>
              </div>
            </div>
          `;

          if (popupRef.current) {
            popupRef.current.setLngLat(e.lngLat).setHTML(popupHtml).addTo(map);

            // Hack to style the popup container since Mapbox GL popups use standard white background
            const popupEl = popupRef.current.getElement();
            if (popupEl) {
              const contentNode = popupEl.querySelector('.mapboxgl-popup-content') as HTMLElement;
              if (contentNode) {
                contentNode.style.backgroundColor = isDarkMode ? '#0f0f11' : '#ffffff';
                contentNode.style.borderColor = isDarkMode ? '#333' : '#e2e8f0';
                contentNode.style.borderWidth = '1px';
                contentNode.style.borderStyle = 'solid';
                contentNode.style.borderRadius = '8px';
                contentNode.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
              const tipNode = popupEl.querySelector('.mapboxgl-popup-tip') as HTMLElement;
              if (tipNode) {
                // Hide the tip for a cleaner floating look, or adjust borders
                tipNode.style.display = 'none';
              }
            }
          }
        }
      });

      map.on('mouseleave', 'state-fills', () => {
        map.getCanvas().style.cursor = '';
        if (popupRef.current) popupRef.current.remove();
      });

      map.on('click', 'state-fills', (e) => {
        if (!e.features || e.features.length === 0) return;
        const stateName = e.features[0].properties?.NAME_1 || e.features[0].properties?.st_nm;
        if (stateName && onRegionClick) onRegionClick(stateName);
      });
    });

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
    };
  }, []); // Run only once to init map, subsequent updates via effects

  // Keep style updated dynamically
  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const targetStyle = isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

      // Update the whole style but re-add the data layer once styles are loaded
      mapRef.current.setStyle(targetStyle);

      const onStyleLoad = () => {
        if (!mapRef.current) return;

        if (!mapRef.current.getSource('india-states')) {
          mapRef.current.addSource('india-states', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson'
          });
        }

        const matchExpression: any[] = ['match', ['coalesce', ['get', 'NAME_1'], ['get', 'st_nm'], '']];
        for (const [stateName, stats] of Object.entries(data)) {
          let color = '#22c55e';
          if (stats.fraudScore >= 7) color = '#ef4444';
          else if (stats.fraudScore >= 4) color = '#f59e0b';
          matchExpression.push(stateName, color);
        }
        matchExpression.push('rgba(156, 163, 175, 0.2)');

        if (!mapRef.current.getLayer('state-fills')) {
          mapRef.current.addLayer({
            id: 'state-fills',
            type: 'fill',
            source: 'india-states',
            paint: {
              'fill-color': matchExpression as mapboxgl.Expression,
              'fill-opacity': 0.7
            }
          });
        }

        if (!mapRef.current.getLayer('state-borders')) {
          mapRef.current.addLayer({
            id: 'state-borders',
            type: 'line',
            source: 'india-states',
            paint: {
              'line-color': '#ffffff',
              'line-width': 0.5
            }
          });
        }
      };

      mapRef.current.once('style.load', onStyleLoad);
    }
  }, [isDarkMode, data]);

  if (tokenMissing) {
    return (
      <div className={`w-full h-full min-h-[600px] flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-[#0f0f11]' : 'bg-slate-50'}`}>
        <AlertTriangle size={48} className="text-orange-500 mb-4" />
        <h3 className={`text-lg font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Mapbox token not configured</h3>
        <p className={`text-sm text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          add VITE_MAPBOX_TOKEN to your .env file
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden min-h-[600px] bg-black/5">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Legend Overlay */}
      <div className={`absolute bottom-6 left-6 z-10 p-4 rounded-xl border backdrop-blur-md ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-white/95 border-slate-200 shadow-lg'}`}>
        <h3 className={`text-[10px] font-bold mb-3 uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Fraud Risk</h3>
        <div className="space-y-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div> <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Low Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div> <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div> <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>High Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
