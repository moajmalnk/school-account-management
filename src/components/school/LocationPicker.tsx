import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { MapPin, Map as MapIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LocationValue = {
  label: string;
  lat: number | null;
  lng: number | null;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type LocationPickerProps = {
  label: string;
  value: string;
  lat: number | null;
  lng: number | null;
  onChange: (next: LocationValue) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India
const DEFAULT_ZOOM = 5;
const PINNED_ZOOM = 15;

const searchCache = new Map<string, NominatimResult[]>();

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function pinIconHtml() {
  return `<div style="width:28px;height:28px;margin-left:-14px;margin-top:-28px;display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="#111"/>
    </svg>
  </div>`;
}

async function searchPlaces(query: string, signal: AbortSignal): Promise<NominatimResult[]> {
  const key = `in:${query.trim().toLowerCase()}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("q", query);

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS, signal });
  if (!res.ok) throw new Error("Search failed");
  const data = (await res.json()) as NominatimResult[];
  searchCache.set(key, data);
  return data;
}

async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS, signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? null;
}

export function LocationPicker({
  label,
  value,
  lat,
  lng,
  onChange,
  placeholder,
  autoFocus,
}: LocationPickerProps) {
  const listId = useId();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const coordsRef = useRef({ lat, lng, value });
  coordsRef.current = { lat, lng, value };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapOpen, setMapOpen] = useState(Boolean(lat != null && lng != null));
  const [mapReady, setMapReady] = useState(false);

  const hasPin = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  const applyCoords = useCallback(
    async (nextLat: number, nextLng: number, labelOverride?: string) => {
      if (labelOverride) {
        onChangeRef.current({ label: labelOverride, lat: nextLat, lng: nextLng });
        return;
      }
      onChangeRef.current({
        label: coordsRef.current.value,
        lat: nextLat,
        lng: nextLng,
      });
      reverseAbortRef.current?.abort();
      const controller = new AbortController();
      reverseAbortRef.current = controller;
      try {
        const name = await reverseGeocode(nextLat, nextLng, controller.signal);
        if (name && !controller.signal.aborted) {
          onChangeRef.current({ label: name, lat: nextLat, lng: nextLng });
        }
      } catch {
        /* ignore abort / network */
      }
    },
    [],
  );

  // Debounced Nominatim search
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(q, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setOpenSuggestions(true);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 600);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  // Create / destroy Leaflet map when panel opens / closes
  useEffect(() => {
    if (!mapOpen) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      setMapReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const { lat: curLat, lng: curLng } = coordsRef.current;
      const pinned =
        curLat != null && curLng != null && Number.isFinite(curLat) && Number.isFinite(curLng);
      const center: [number, number] = pinned ? [curLat!, curLng!] : DEFAULT_CENTER;
      const zoom = pinned ? PINNED_ZOOM : DEFAULT_ZOOM;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: pinIconHtml(),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const ensureMarker = (mLat: number, mLng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([mLat, mLng]);
          return markerRef.current;
        }
        const marker = L.marker([mLat, mLng], { draggable: true, icon }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          void applyCoords(pos.lat, pos.lng);
        });
        markerRef.current = marker;
        return marker;
      };

      if (pinned) {
        ensureMarker(curLat!, curLng!);
      }

      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        ensureMarker(clickLat, clickLng);
        void applyCoords(clickLat, clickLng);
      });

      mapRef.current = map;
      requestAnimationFrame(() => {
        if (cancelled) return;
        map.invalidateSize();
        // Re-read coords in case the user picked a place while Leaflet was loading
        const latest = coordsRef.current;
        const nowPinned =
          latest.lat != null &&
          latest.lng != null &&
          Number.isFinite(latest.lat) &&
          Number.isFinite(latest.lng);
        if (nowPinned) {
          ensureMarker(latest.lat!, latest.lng!);
          map.setView([latest.lat!, latest.lng!], PINNED_ZOOM);
        }
        setMapReady(true);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapOpen, applyCoords]);

  // Sync marker when lat/lng change from search / clear
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapOpen || !mapReady) return;

    if (hasPin && lat != null && lng != null) {
      map.invalidateSize();
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          className: "",
          html: pinIconHtml(),
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          void applyCoords(pos.lat, pos.lng);
        });
        markerRef.current = marker;
      }
      map.setView([lat, lng], PINNED_ZOOM);
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [lat, lng, hasPin, mapOpen, mapReady, applyCoords]);

  useEffect(() => {
    return () => {
      reverseAbortRef.current?.abort();
    };
  }, []);

  const pickSuggestion = (item: NominatimResult) => {
    const nextLat = Number(item.lat);
    const nextLng = Number(item.lon);
    onChange({
      label: item.display_name,
      lat: Number.isFinite(nextLat) ? nextLat : null,
      lng: Number.isFinite(nextLng) ? nextLng : null,
    });
    setOpenSuggestions(false);
    setSuggestions([]);
    if (!mapOpen) setMapOpen(true);
  };

  const clearPin = () => {
    onChange({ label: value, lat: null, lng: null });
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-black/55">
          {label}
        </Label>
        <button
          type="button"
          onClick={() => setMapOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
            mapOpen
              ? "bg-black text-white"
              : "bg-[#F4F4F5] text-black/60 hover:bg-[#E8E8EA] hover:text-black",
          )}
        >
          <MapIcon className="h-3 w-3" />
          {mapOpen ? "Hide map" : "Pick on map"}
        </button>
      </div>

      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            onChange({ label: e.target.value, lat, lng });
            setOpenSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpenSuggestions(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpenSuggestions(false), 150);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={openSuggestions}
          aria-controls={listId}
          aria-autocomplete="list"
        />

        {openSuggestions && (suggestions.length > 0 || searching) ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white py-1 shadow-lg"
          >
            {searching && suggestions.length === 0 ? (
              <li className="px-3 py-2 text-[12px] text-black/45">Searching…</li>
            ) : (
              suggestions.map((item) => (
                <li key={item.place_id} role="option">
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-[12.5px] text-black hover:bg-[#F4F4F5]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(item)}
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black/40" />
                    <span className="line-clamp-2 leading-snug">{item.display_name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      {hasPin ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E5E5] bg-[#F4F4F5] px-2.5 py-0.5 font-mono text-[10.5px] text-black/70">
            <MapPin className="h-3 w-3" />
            {formatCoords(lat!, lng!)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-[10px] text-black/50 hover:text-black"
            onClick={clearPin}
          >
            <X className="h-3 w-3" />
            Clear pin
          </Button>
        </div>
      ) : null}

      {mapOpen ? (
        <div className="overflow-hidden rounded-lg border border-[#E5E5E5]">
          <div
            ref={mapContainerRef}
            className="h-[180px] w-full bg-[#F4F4F5]"
            aria-label={`${label} map`}
          />
          <div className="border-t border-[#EFEFEF] px-3 py-1.5 text-[10px] text-black/40">
            {mapReady ? "Click the map or drag the pin to set location" : "Loading map…"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
