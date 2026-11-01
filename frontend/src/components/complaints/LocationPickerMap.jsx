import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix leaflet default marker icons in modern bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const LocationPickerMap = ({
  latitude,
  longitude,
  onLocationSelect,
  readOnly = false,
  zoom = 13
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultCenter = [latitude || 28.6139, longitude || 77.2090];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy prior map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: zoom,
      scrollWheelZoom: !readOnly
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Initial marker if lat/lon provided
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude]).addTo(map);
    }

    // Click handler to pick location
    if (!readOnly) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [readOnly]);

  // Update marker position if coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && latitude && longitude) {
      const latlng = [latitude, longitude];
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView(latlng, mapInstanceRef.current.getZoom());
    }
  }, [latitude, longitude]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner">
      <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-10" />
      {!readOnly && (
        <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur px-2.5 py-1 rounded text-[11px] font-medium text-slate-700 shadow border border-slate-200">
          📍 Click anywhere on the map to pin exact civic issue location
        </div>
      )}
    </div>
  );
};
