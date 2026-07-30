import { useState, useEffect } from "react";
import { getPlacePhoto } from "../services/places";
import { typeColors } from "../constants/typeColors";

export default function PlanModal({ plan, onClose }) {
  const [stopData, setStopData] = useState({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    if (plan.stops.length === 0) { setLoadingPhotos(false); return; }
    async function fetchPhotos() {
      const results = {};
      await Promise.all(plan.stops.map(async (stop) => {
        const data = await getPlacePhoto(stop.place, "Bengaluru");
        if (data) results[stop.place] = data;
      }));
      setStopData(results);
      setLoadingPhotos(false);
    }
    fetchPhotos();
  }, [plan.id]);

  const validStops = plan.stops.filter((s) => stopData[s.place]?.lat);
  const routeUrl = validStops.length > 0 ? `https://www.google.com/maps/dir/${validStops.map(s => `${stopData[s.place].lat},${stopData[s.place].lng}`).join("/")}` : "https://www.google.com/maps";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "#0F172A", border: `1px solid ${plan.color}40`, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="p-5" style={{ background: `${plan.color}15`, borderBottom: `1px solid ${plan.color}30` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{plan.emoji}</div>
              <div>
                <h2 className="text-white font-black text-xl">{plan.title}</h2>
                <p className="text-sm" style={{ color: plan.color }}>{plan.tagline}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white opacity-50 text-xl font-bold ml-2">X</button>
          </div>
          {plan.budget && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: `${plan.color}40` }}>Budget: {plan.budget}</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "rgba(255,255,255,0.1)" }}>{plan.stops.length} stops</span>
            </div>
          )}
        </div>
        <div className="overflow-y-auto p-5" style={{ maxHeight: "72vh" }}>
          <div className="flex flex-col gap-3 mb-6">
            {plan.stops.map((stop, index) => {
              const typeColor = typeColors[stop.type] || plan.color;
              const data = stopData[stop.place];
              return (
                <div key={index} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {data?.photoUrl ? (
                    <div className="w-full h-40 overflow-hidden"><img src={data.photoUrl} alt={stop.place} className="w-full h-full object-cover" /></div>
                  ) : loadingPhotos ? (
                    <div className="w-full h-32 flex items-center justify-center" style={{ background: `${plan.color}10` }}><p className="text-white opacity-30 text-xs">Loading photo...</p></div>
                  ) : (
                    <div className="w-full h-20 flex items-center justify-center text-4xl" style={{ background: `${plan.color}10` }}>{plan.emoji}</div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${typeColor}20`, color: typeColor }}>{stop.type}</span>
                      <span className="text-white opacity-40 text-xs">{stop.time}</span>
                    </div>
                    <h3 className="text-white font-black text-base mb-1">{stop.place}</h3>
                    <p className="text-white opacity-60 text-sm mb-3">{stop.note}</p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {stop.cost && <span className="text-xs font-semibold" style={{ color: plan.color }}>Cost: {stop.cost}</span>}
                      {data?.mapsUrl && <button onClick={() => window.open(data.mapsUrl, "_blank")} className="text-xs font-bold px-3 py-1.5 rounded-xl text-white" style={{ background: "rgba(6,182,212,0.3)" }}>View on Map</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${plan.color}30` }}>
            <div className="p-3" style={{ background: `${plan.color}15` }}>
              <p className="text-white font-bold text-sm">Full Day Route</p>
              <p className="text-white opacity-50 text-xs">All {plan.stops.length} stops</p>
            </div>
            {!loadingPhotos && validStops.length > 0 ? (
              <button onClick={() => window.open(routeUrl, "_blank")} className="w-full py-3 text-white font-bold text-sm" style={{ background: `${plan.color}30` }}>Open Full Route in Google Maps</button>
            ) : (
              <div className="p-8 text-center"><p className="text-white opacity-40 text-sm">{loadingPhotos ? "Loading map..." : "Map unavailable"}</p></div>
            )}
          </div>
          <button className="w-full py-4 rounded-2xl text-white font-black text-sm tracking-widest uppercase" style={{ background: plan.color }} onClick={onClose}>Let's Go!</button>
        </div>
      </div>
    </div>
  );
}
