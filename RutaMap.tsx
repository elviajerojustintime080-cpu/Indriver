import React, { useEffect, useRef } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface RutaMapProps {
  origin?: Coords | null;
  dest?: Coords | null;
  driverLoc?: Coords | null;
  userLoc?: Coords | null;
  onSelectCoords?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

export const RutaMap: React.FC<RutaMapProps> = ({
  origin,
  dest,
  driverLoc,
  userLoc,
  onSelectCoords,
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [18.44849, -95.21204],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        scrollWheelZoom: interactive
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      if (interactive && onSelectCoords) {
        map.on('click', (e: any) => {
          onSelectCoords(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstance.current = map;
    };

    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapInstance.current) return;

    const map = mapInstance.current;

    Object.values(markersRef.current).forEach((m: any) => map.removeLayer(m));
    markersRef.current = {};

    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (origin) {
      const originIcon = L.divIcon({
        className: 'custom-radar-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-emerald-500 opacity-40 animate-ping"></span>
            <span class="w-4 h-4 rounded-full bg-emerald-700 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      markersRef.current.origin = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);
    }

    if (dest) {
      const destIcon = L.divIcon({
        className: 'custom-dest-icon',
        html: `
          <div class="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full border-2 border-white shadow-md text-white text-[10px] font-bold">
            B
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      markersRef.current.dest = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);
    }

    if (userLoc) {
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-6 h-6 rounded-full bg-blue-500 opacity-50 animate-ping"></span>
            <span class="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      markersRef.current.user = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(map);
    }

    if (driverLoc) {
      const driverIcon = L.divIcon({
        className: 'custom-driver-icon',
        html: `
          <div class="flex items-center justify-center p-1.5 bg-[#0e2617] rounded-full border border-emerald-400 shadow-xl transition-transform duration-500">
            <svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      markersRef.current.driver = L.marker([driverLoc.lat, driverLoc.lng], { icon: driverIcon }).addTo(map);
    }

    if (origin && dest) {
      const midLat = origin.lat;
      const midLng = dest.lng;
      const path = [
        [origin.lat, origin.lng],
        [midLat, midLng],
        [dest.lat, dest.lng]
      ];

      routeLineRef.current = L.polyline(path, {
        color: '#0e2617',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 8'
      }).addTo(map);

      map.fitBounds(L.latLngBounds([origin, dest]), { padding: [50, 50] });
    }
  }, [origin, dest, driverLoc, userLoc]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="w-[200%] h-full bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full animate-[sweep_7s_infinite_linear]" />
      </div>
      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};