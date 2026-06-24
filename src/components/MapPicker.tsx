"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

interface Props {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: Props) {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef      = useRef<LeafletMarker | null>(null);
  const [address,  setAddress]  = useState<string>("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Check if leaflet already initialized this container
    if ((mapRef.current as unknown as Record<string, unknown>)._leaflet_id) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if ((mapRef.current as unknown as Record<string, unknown>)._leaflet_id) return;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const defaultLat = initialLat ?? 31.9539;
      const defaultLng = initialLng ?? 35.9106;

      const map = L.map(mapRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      const reverseGeocode = async (lat: number, lng: number) => {
        setLoading(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`
          );
          const data = await res.json() as { display_name?: string };
          const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          onLocationSelect(lat, lng, addr);
        } catch {
          onLocationSelect(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } finally {
          setLoading(false);
        }
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.setView([lat, lng], 15);
          marker.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        },
        () => {
          reverseGeocode(defaultLat, defaultLng);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: "280px", borderRadius: "12px", overflow: "hidden", border: "1.5px solid #E5E0D8" }}
      />
      {loading && (
        <p className="text-xs mt-2 text-center" style={{ color: "#9B8B73" }}>
          جاري تحديد العنوان...
        </p>
      )}
      {address && !loading && (
        <p className="text-xs mt-2 text-center font-bold" style={{ color: "#1A1208" }}>
          📍 {address}
        </p>
      )}
    </div>
  );
}
