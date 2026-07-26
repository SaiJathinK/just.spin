import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * LiveStat
 * Small, reusable "live activity" line for the Hero Card (or anywhere else).
 *
 * Currently supports:
 *   type="placeCount" → total places for a given city
 *
 * To add a new stat later, just add another branch inside fetchStat()
 * and a matching entry in STAT_CONFIG below — the component, loading
 * state, error handling, and styling all stay the same.
 *
 * Example future additions:
 *   <LiveStat city={cityName} type="spinsToday" />
 *   <LiveStat city={cityName} type="newThisMonth" />
 *   <LiveStat city={cityName} type="favorites" />
 *
 * Assumes a Firestore collection called "places" where each document has
 * a "city" field matching the city name (e.g. "Bengaluru"). Adjust the
 * collection/field names below if yours differ.
 */

const STAT_CONFIG = {
  placeCount: {
    icon: "📍",
    label: (value) => `${value} places ready to explore`,
  },
  // spinsToday: { icon: "🔥", label: (value) => `${value} people spun today` },
  // newThisMonth: { icon: "🎯", label: (value) => `${value} new places added this month` },
  // favorites: { icon: "❤️", label: (value) => `${value} community favorites` },
};

export default function LiveStat({ city, type = "placeCount" }) {
  const [value, setValue] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    setStatus("loading");

    async function fetchStat() {
      try {
        if (type === "placeCount") {
          // getCountFromServer() fetches ONLY the count, not full documents —
          // Firestore's equivalent of a cheap count-only query.
          const placesRef = collection(db, "places");
          const cityQuery = query(placesRef, where("city", "==", city));
          const snapshot = await getCountFromServer(cityQuery);
          const count = snapshot.data().count;

          if (!cancelled) {
            setValue(count ?? 0);
            setStatus("ready");
          }
        }

        // Future stat types go here, following the same pattern:
        // if (type === "spinsToday") {
        //   const startOfDay = new Date();
        //   startOfDay.setHours(0, 0, 0, 0);
        //   const spinsRef = collection(db, "spins");
        //   const spinsQuery = query(
        //     spinsRef,
        //     where("city", "==", city),
        //     where("createdAt", ">=", startOfDay)
        //   );
        //   const snapshot = await getCountFromServer(spinsQuery);
        //   if (!cancelled) { setValue(snapshot.data().count); setStatus("ready"); }
        // }
      } catch (err) {
        // Per spec: never show an error to the user, just hide the stat.
        console.warn("LiveStat: fetch failed, hiding stat.", err);
        if (!cancelled) setStatus("error");
      }
    }

    fetchStat();
    return () => {
      cancelled = true;
    };
  }, [city, type]);

  // Silently hide on error — no broken UI, no error message shown to the user.
  if (status === "error") return null;

  const config = STAT_CONFIG[type];

  return (
    <p className="text-white/80 text-xs font-medium mt-2 flex items-center gap-1.5 min-h-[16px]">
      {status === "loading" ? (
        // Small skeleton placeholder instead of a "Loading..." text flash
        <span className="inline-block h-3 w-32 bg-white/10 rounded animate-pulse" />
      ) : (
        <>
          <span>{config.icon}</span>
          <span>{config.label(value)}</span>
        </>
      )}
    </p>
  );
}
