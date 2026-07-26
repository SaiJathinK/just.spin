import { useEffect, useState } from "react";
import { getPlacePhoto } from "../services/places";

/**
 * CircularSpots
 * Row of circular thumbnails for a handful of well-known spots in a city.
 * Each thumbnail is fetched live via your existing getPlacePhoto() — so every
 * thumbnail carries a real photo, placeId, lat/lng, and Google Maps URL,
 * not just a hardcoded image.
 *
 * Clicking a thumbnail calls onSeedSelect(placeName), which the parent
 * (CityPage) uses to kick off a fresh spin "near" that place.
 */

// Just the names — everything else (photo, placeId, coordinates) is fetched
// live for the given city, so this list is easy to edit per city later.
const SPOT_NAMES = ["Cubbon Park", "Lalbagh", "Nandi Hills", "Bangalore Palace", "Church Street"];

export default function CircularSpots({ cityName, onSeedSelect }) {
  const [spots, setSpots] = useState([]); // [{ name, photoUrl, placeId, lat, lng, mapsUrl }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityName) return;
    let cancelled = false;
    setLoading(true);

    async function loadSpots() {
      const results = await Promise.all(
        SPOT_NAMES.map(async (name) => {
          const details = await getPlacePhoto(name, cityName);
          return { name, ...details }; // details: photoUrl, placeId, lat, lng, mapsUrl (or null on failure)
        })
      );
      if (!cancelled) {
        // Only keep ones that actually resolved to a real place
        setSpots(results.filter((s) => s.placeId));
        setLoading(false);
      }
    }

    loadSpots();
    return () => {
      cancelled = true;
    };
  }, [cityName]);

  if (loading) {
    return (
      <div className="flex gap-3 mt-4 px-1">
        {SPOT_NAMES.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
            <div className="w-12 h-2 rounded bg-white/10 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (spots.length === 0) return null; // silently hide if nothing resolved

  return (
    <div className="flex gap-3 mt-4 px-1 overflow-x-auto scrollbar-none">
      {spots.map((spot) => (
        <button
          key={spot.placeId}
          type="button"
          onClick={() => onSeedSelect(spot.name)}
          aria-label={`Find spots near ${spot.name}`}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl"
        >
          <div
            className="w-14 h-14 rounded-full bg-cover bg-center ring-2 ring-white/20"
            style={{ backgroundImage: spot.photoUrl ? `url(${spot.photoUrl})` : undefined, backgroundColor: "#1E293B" }}
          />
          <span className="text-white/70 text-[11px] font-medium max-w-[60px] text-center leading-tight">
            {spot.name}
          </span>
        </button>
      ))}
    </div>
  );
}
