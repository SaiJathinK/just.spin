import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * CategoryStats
 * 3-column strip under the Hero Card. Bold labels stay as fixed branding
 * copy ("Vibrant City", "Food & Breweries", "Heritage & Culture") — only
 * the subtext line becomes a live count, pulled from Firestore instead of
 * being a hardcoded phrase.
 *
 * Each column maps to a real place "category" field:
 *   Vibrant City       → category === "Nature"
 *   Food & Breweries   → category === "Food"
 *   Heritage & Culture → category === "Heritage"
 *
 * Assumes a "places" collection where each document has "city" and
 * "category" fields (e.g. city: "Bengaluru", category: "Food") — matching
 * the same shape your places.js shapePlace() function already produces.
 */

const COLUMNS = [
  { label: "Vibrant City", category: "Nature" },
  { label: "Food & Breweries", category: "Food" },
  { label: "Heritage & Culture", category: "Heritage" },
];

export default function CategoryStats({ cityName }) {
  // counts[category] = number | "error" | undefined (still loading)
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!cityName) return;
    let cancelled = false;
    setCounts({});

    COLUMNS.forEach(async ({ category }) => {
      try {
        const placesRef = collection(db, "places");
        const q = query(placesRef, where("city", "==", cityName), where("category", "==", category));
        const snapshot = await getCountFromServer(q);
        if (!cancelled) {
          setCounts((prev) => ({ ...prev, [category]: snapshot.data().count ?? 0 }));
        }
      } catch (err) {
        console.warn(`CategoryStats: count failed for ${category}, hiding subtext.`, err);
        if (!cancelled) {
          setCounts((prev) => ({ ...prev, [category]: "error" }));
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cityName]);

  return (
    <div className="grid grid-cols-3 gap-2 mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
      {COLUMNS.map(({ label, category }) => {
        const count = counts[category];
        return (
          <div key={category} className="text-center">
            <p className="text-white text-xs font-bold leading-tight">{label}</p>
            {count === undefined && (
              <span className="inline-block h-3 w-14 mt-1.5 rounded bg-white/10 animate-pulse" />
            )}
            {count === "error" && null /* silently hide subtext on error, keep the label */}
            {typeof count === "number" && (
              <p className="text-white/60 text-xs mt-1">{count}+ spots</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
